# SimiStream — Prompt Ledger & Synthesis Engine Technical Spec

## Overview

The Prompt Ledger is the core data structure that makes "Pull Simulation" possible. It stores the creator's base prompt and every modification as an ordered sequence of entries. The Synthesis Engine reads the ledger at a point in time and produces a single merged prompt that Odyssey can use to reconstruct the simulation state.

---

## 1. Prompt Ledger

### 1.1 Data Model

```typescript
enum LedgerEntryType {
  BASE_PROMPT = "base_prompt",    // Initial environment description
  ADDITION = "addition",          // Something added to the scene
  REMOVAL = "removal",            // Something explicitly removed
  MODIFICATION = "modification",  // Change to an existing element
}

interface LedgerEntry {
  id: string;                     // UUID
  sessionId: string;              // Parent session UUID
  sequenceNumber: number;         // Monotonically increasing, gap-free
  entryType: LedgerEntryType;
  rawTranscription: string | null; // Original speech (null if typed)
  distilledContent: string;       // Extracted actionable phrase
  createdAt: Date;
}
```

### 1.2 Prisma Schema

```prisma
model PromptLedgerEntry {
  id                String           @id @default(uuid())
  sessionId         String
  session           Session          @relation(fields: [sessionId], references: [id])
  sequenceNumber    Int
  entryType         LedgerEntryType
  rawTranscription  String?
  distilledContent  String
  createdAt         DateTime         @default(now())

  @@unique([sessionId, sequenceNumber])
  @@index([sessionId, sequenceNumber])
}

enum LedgerEntryType {
  base_prompt
  addition
  removal
  modification
}
```

### 1.3 Write Path

Only the agent service writes to the ledger. The sequence is:

1. Creator types or speaks a modification
2. Agent parses the input, extracts the actionable content
3. Agent writes a new `LedgerEntry` to PostgreSQL
4. Agent publishes a `ledger:update` event to Redis pub/sub
5. WebSocket server picks up the Redis event and broadcasts to all connected viewers
6. Simultaneously, agent injects the modification into the live Odyssey Interactive Stream

Sequence numbers are assigned using a PostgreSQL sequence scoped to the session:

```sql
-- Atomic sequence number assignment
INSERT INTO prompt_ledger_entries (id, session_id, sequence_number, entry_type, distilled_content)
VALUES (
  gen_random_uuid(),
  $1,
  (SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM prompt_ledger_entries WHERE session_id = $1),
  $2,
  $3
)
RETURNING *;
```

In Prisma, use a transaction to ensure atomicity:

```typescript
async function appendToLedger(
  sessionId: string,
  entryType: LedgerEntryType,
  distilledContent: string,
  rawTranscription?: string
): Promise<LedgerEntry> {
  return prisma.$transaction(async (tx) => {
    const lastEntry = await tx.promptLedgerEntry.findFirst({
      where: { sessionId },
      orderBy: { sequenceNumber: "desc" },
    });

    const nextSequence = (lastEntry?.sequenceNumber ?? 0) + 1;

    return tx.promptLedgerEntry.create({
      data: {
        sessionId,
        sequenceNumber: nextSequence,
        entryType,
        distilledContent,
        rawTranscription: rawTranscription ?? null,
      },
    });
  });
}
```

### 1.4 Read Path

**Full ledger** (for fork):
```typescript
async function getLedger(sessionId: string): Promise<LedgerEntry[]> {
  return prisma.promptLedgerEntry.findMany({
    where: { sessionId },
    orderBy: { sequenceNumber: "asc" },
  });
}
```

**Ledger at a point in time** (for fork at specific moment):
```typescript
async function getLedgerAtSequence(
  sessionId: string,
  maxSequence: number
): Promise<LedgerEntry[]> {
  return prisma.promptLedgerEntry.findMany({
    where: {
      sessionId,
      sequenceNumber: { lte: maxSequence },
    },
    orderBy: { sequenceNumber: "asc" },
  });
}
```

### 1.5 Real-Time Sync

Viewer clients connect via WebSocket and subscribe to a session's ledger updates:

```typescript
// Server-side: publish on new entry
redis.publish(`session:${sessionId}:ledger`, JSON.stringify(newEntry));

// WebSocket handler: forward to connected clients
redis.subscribe(`session:${sessionId}:ledger`, (message) => {
  const entry = JSON.parse(message);
  connectedClients
    .filter((c) => c.sessionId === sessionId)
    .forEach((c) => c.send({ type: "ledger:update", data: entry }));
});
```

Client-side hook:

```typescript
function useLedger(sessionId: string) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    // Fetch initial state
    fetch(`/api/sessions/${sessionId}/ledger`)
      .then((r) => r.json())
      .then(setEntries);

    // Subscribe to updates
    const ws = new WebSocket(`${WS_URL}/sessions/${sessionId}/ledger/stream`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "ledger:update") {
        setEntries((prev) => [...prev, msg.data]);
      }
    };

    return () => ws.close();
  }, [sessionId]);

  return entries;
}
```

---

## 2. Synthesis Engine

### 2.1 Purpose

Takes a `LedgerEntry[]` and produces a single coherent prompt string that, when sent to Odyssey, reconstructs the simulation state as closely as possible.

### 2.2 Algorithm

```
Input: LedgerEntry[] (ordered by sequenceNumber)
Output: string (merged Odyssey prompt)

1. Extract base prompt (entryType === "base_prompt")
2. Collect all additions in order
3. Process removals: mark additions as cancelled if a later removal references them
4. Process modifications: update the referenced addition's content
5. Build final additions list (only non-cancelled entries)
6. Send to Claude API with synthesis prompt (see below)
7. Return Claude's merged prompt string
```

### 2.3 Synthesis Prompt

```typescript
const SYNTHESIS_SYSTEM_PROMPT = `You are a scene description synthesizer. Your job is to take a base environment description and a list of modifications, and produce a single, coherent prompt that describes the complete scene.

Rules:
- Start from the base prompt and incorporate all additions naturally
- If a removal cancels an addition, exclude it entirely
- If modifications conflict (e.g., "add rain" then "make it sunny"), the later one wins
- Maintain the atmosphere and tone of the base prompt
- Keep the output concise — it must work as a prompt for a world simulation model
- Do not add anything that wasn't in the base prompt or additions
- Preserve the chronological order of additions where it affects the scene (e.g., "buildings" before "destroy buildings" matters)
- Output ONLY the merged prompt, nothing else`;

async function synthesize(entries: LedgerEntry[]): Promise<string> {
  const basePrompt = entries.find((e) => e.entryType === "base_prompt");
  if (!basePrompt) throw new Error("No base prompt in ledger");

  const modifications = entries
    .filter((e) => e.entryType !== "base_prompt")
    .map((e) => `[${e.entryType.toUpperCase()}] ${e.distilledContent}`);

  if (modifications.length === 0) {
    return basePrompt.distilledContent;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: SYNTHESIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Base prompt:\n"${basePrompt.distilledContent}"\n\nModifications (in order):\n${modifications.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nProduce the merged scene prompt.`,
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "";
}
```

### 2.4 Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty ledger (no base prompt) | Error — cannot synthesize |
| Base prompt only, no additions | Return base prompt as-is (skip LLM call) |
| 1-3 additions | Direct merge, LLM not strictly necessary but use for consistency |
| 20+ additions | LLM synthesis essential, may need to summarize/compress |
| Contradictions ("add rain" → "make it sunny") | Later entry wins, LLM resolves naturally |
| Removal of something not added | Ignore the removal |
| Rapid additions (multiple per second) | Batch into single ledger entry if within 2-second window |
| Prompt too long for Odyssey | Synthesis model compresses; add max_length guidance |

### 2.5 Caching Strategy

For sessions with many viewers pulling, avoid re-synthesizing the same ledger state:

```typescript
// Cache key: session ID + latest sequence number
const cacheKey = `synthesis:${sessionId}:${maxSequence}`;

async function getCachedSynthesis(
  sessionId: string,
  maxSequence: number
): Promise<string | null> {
  return redis.get(cacheKey);
}

async function cacheSynthesis(
  sessionId: string,
  maxSequence: number,
  mergedPrompt: string
): Promise<void> {
  // Cache for 5 minutes — ledger might grow but this sequence won't change
  await redis.set(cacheKey, mergedPrompt, "EX", 300);
}
```

This means if 50 viewers all pull at sequence number 47, only the first pull triggers LLM synthesis. The rest hit the cache.

---

## 3. Fork Flow (End-to-End)

```
Viewer presses "Pull Simulation"
        │
        ▼
POST /api/sessions/:id/fork
        │
        ▼
Read current ledger for session
(all entries up to latest sequence)
        │
        ▼
Check synthesis cache
  ├── Cache hit → use cached merged prompt
  └── Cache miss → call synthesize(entries), cache result
        │
        ▼
Call Odyssey API: create Interactive Stream
with merged prompt
        │
        ▼
Store Fork record in database
(session_id, viewer_id, forked_at_sequence, merged_prompt, odyssey_stream_id)
        │
        ▼
Return fork details to viewer
(fork_id, odyssey_stream_embed_url)
        │
        ▼
Frontend renders fork view
with embedded Interactive Stream
        │
        ▼
Viewer is now independent —
their own ledger starts from the merged prompt
```

---

## 4. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Ledger write latency | < 100ms | PostgreSQL insert + Redis publish |
| WebSocket delivery | < 200ms | Redis pub/sub to client |
| Prompt synthesis (cache miss) | < 3 seconds | Claude API call |
| Prompt synthesis (cache hit) | < 50ms | Redis get |
| Odyssey stream creation | TBD | Depends on Odyssey API |
| Total pull-to-render | < 10 seconds | Synthesis + Odyssey stream creation |
