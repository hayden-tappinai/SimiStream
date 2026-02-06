# SimiStream — Product Requirements Document

**Version:** 1.0
**Author:** Hayden Tapp
**Date:** February 5, 2026
**Status:** Pre-Development

---

## 1. Vision

SimiStream is a platform where creators build interactive world simulations (powered by Odyssey-2 Pro) while streaming to an audience, and viewers can "pull" that simulation onto their own screen to explore "what if" scenarios independently. Think Twitch meets a science lab — watch someone build a world, then fork it and run your own experiments.

---

## 2. Problem Statement

Current streaming platforms are passive. Viewers watch but cannot interact with or diverge from the content. Educational and entertainment simulation content has no mechanism for audiences to take what they see and explore alternatives. The question every viewer asks — "what if they did it differently?" — has no outlet.

---

## 3. Core User Flows

### 3.1 Creator Flow

1. Creator logs in, starts a new SimiStream session
2. Creator enters an initial environment prompt (e.g., "A quiet Japanese garden at sunset with a koi pond, stone lanterns, and cherry blossom trees gently swaying in the breeze.")
3. Platform sends prompt to Odyssey Interactive Stream endpoint → simulation begins streaming
4. Creator's simulation is broadcast to viewers via Odyssey Viewable Stream endpoint
5. As the creator speaks, ElevenLabs transcribes audio in real-time
6. A speech-to-simulation agent parses the transcription, extracts actionable additions (e.g., "cats", "rain", "tornado"), and:
   - Injects them into the live Odyssey simulation
   - Logs them to the Session Prompt Ledger
7. Creator continues building/narrating. Session ends when creator stops.

### 3.2 Viewer Flow

1. Viewer opens a SimiStream, watches the creator's simulation via embedded Viewable Stream
2. At any point, viewer presses the **"Pull Simulation"** button
3. Platform retrieves the Session Prompt Ledger (base prompt + all additions up to that moment)
4. A prompt synthesis model merges the base prompt and additions into a single coherent prompt
5. Platform sends the merged prompt to Odyssey's Interactive Stream endpoint → viewer gets their own simulation instance
6. Viewer can now speak/type their own modifications, diverging from the creator's world
7. Viewer's fork has its own independent Session Prompt Ledger from that point forward

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SimiStream Platform                    │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Creator   │───▶│ Speech-to-Sim│───▶│ Odyssey API   │  │
│  │ Client    │    │ Agent        │    │ (Interactive   │  │
│  │           │    │              │    │  Stream)       │  │
│  └──────────┘    └──────┬───────┘    └───────┬───────┘  │
│                         │                     │          │
│                         ▼                     ▼          │
│                  ┌──────────────┐    ┌───────────────┐  │
│                  │ Session      │    │ Odyssey API   │  │
│                  │ Prompt       │    │ (Viewable     │  │
│                  │ Ledger       │    │  Stream)      │  │
│                  └──────┬───────┘    └───────┬───────┘  │
│                         │                     │          │
│                         ▼                     ▼          │
│                  ┌──────────────┐    ┌───────────────┐  │
│                  │ Prompt       │    │ Viewer        │  │
│                  │ Synthesis    │───▶│ Client        │  │
│                  │ Model        │    │ (pulls fork)  │  │
│                  └──────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Component Breakdown

**A. Session Prompt Ledger Service**
- Database: PostgreSQL with ordered entries per session
- Schema: `session_id`, `entry_type` (base | addition), `content` (text), `timestamp`, `sequence_number`
- Exposes REST + WebSocket APIs for writing (from agent) and reading (for pull)
- Real-time sync: pushes ledger updates to all connected viewer clients via WebSocket so the "pull" button always has current state

**B. Speech-to-Simulation Agent**
- Input: real-time audio transcription from ElevenLabs
- Processing: LLM (Claude) parses transcription, extracts actionable scene modifications
- Dual output:
  1. Formats extracted additions as Odyssey-compatible prompts/actions and injects into the live Interactive Stream
  2. Logs the distilled keyword/phrase to the Session Prompt Ledger
- Must handle: filler words, incomplete sentences, corrections ("actually, remove the cats"), ambiguity
- Latency target: < 2 seconds from speech to simulation update

**C. Prompt Synthesis Engine**
- Triggered when viewer presses "Pull Simulation"
- Input: base prompt + ordered list of additions from the ledger
- Processing: LLM (Claude) generates a single coherent merged prompt that includes all elements in the correct narrative order
- Output: one Odyssey-compatible prompt string
- Must handle: contradictions (creator added rain, then said "make it sunny" — latest wins), ordering, and prompt length limits

**D. Odyssey Integration Layer**
- Wraps all three Odyssey API endpoints:
  - **Interactive Streams**: creator's live session + viewer forks
  - **Viewable Streams**: broadcast to all viewers watching a session
  - **Simulations**: (future) offline/batch generation for replays
- Manages API keys, rate limits, session lifecycle
- Handles stream health monitoring and reconnection

**E. Platform Frontend**
- Creator Dashboard: session setup, prompt input, live simulation view, voice controls, session management
- Viewer Page: embedded Viewable Stream, "Pull Simulation" button, chat/interaction area
- Fork View: Interactive Stream embed for the viewer's forked simulation, voice/text input for modifications
- Built with: Next.js + React, Tailwind CSS

**F. Platform Backend**
- Auth: user accounts, creator vs. viewer roles
- Session management: create, join, end sessions
- WebSocket server: real-time ledger sync, stream status
- API gateway: routes to Odyssey, ElevenLabs, LLM services
- Built with: Node.js/Express or Next.js API routes

---

## 5. Data Models

### Session

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique session identifier |
| creator_id | UUID | Creator's user ID |
| title | string | Session title |
| status | enum | draft, live, ended |
| odyssey_interactive_stream_id | string | Odyssey stream reference for creator |
| odyssey_viewable_stream_id | string | Odyssey stream reference for viewers |
| created_at | timestamp | Session creation time |
| ended_at | timestamp | Session end time |

### PromptLedgerEntry

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Entry identifier |
| session_id | UUID | Parent session |
| sequence_number | integer | Ordered position in the ledger |
| entry_type | enum | base_prompt, addition, removal |
| raw_transcription | string | What the creator actually said |
| distilled_content | string | Extracted actionable phrase |
| merged_prompt_at_point | string | (optional) cached merged prompt up to this entry |
| created_at | timestamp | When the entry was logged |

### Fork

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Fork identifier |
| session_id | UUID | Source session |
| viewer_id | UUID | Viewer who pulled |
| forked_at_sequence | integer | Ledger sequence number at pull time |
| merged_prompt | string | The synthesized prompt used to create fork |
| odyssey_interactive_stream_id | string | Odyssey stream for viewer's fork |
| created_at | timestamp | Fork creation time |

---

## 6. API Endpoints

### Sessions
- `POST /api/sessions` — Create new session (creator)
- `GET /api/sessions/:id` — Get session details
- `POST /api/sessions/:id/start` — Start streaming (triggers Odyssey Interactive + Viewable stream creation)
- `POST /api/sessions/:id/end` — End session

### Prompt Ledger
- `GET /api/sessions/:id/ledger` — Get full ledger for a session
- `GET /api/sessions/:id/ledger?at_sequence=N` — Get ledger up to sequence N
- `WS /api/sessions/:id/ledger/stream` — WebSocket for real-time ledger updates

### Forks
- `POST /api/sessions/:id/fork` — Pull simulation (triggers synthesis + Odyssey stream creation)
- `GET /api/forks/:id` — Get fork details and stream info

### Agent Pipeline
- `POST /api/sessions/:id/transcription` — Receive transcription chunks from ElevenLabs webhook
- Internal: agent processes transcription → writes to ledger + injects into Odyssey

---

## 7. Third-Party Dependencies

| Service | Purpose | Endpoint Type |
|---------|---------|---------------|
| Odyssey-2 Pro API | World simulation engine | Interactive Streams, Viewable Streams, Simulations |
| ElevenLabs | Real-time speech transcription | WebSocket / REST |
| Claude API (Anthropic) | Speech-to-sim agent + prompt synthesis | REST |
| PostgreSQL | Prompt ledger + session data | Database |
| Redis | Pub/sub for real-time sync, session state caching | In-memory |

---

## 8. Key Technical Risks

1. **Prompt synthesis accuracy**: Merged prompts may produce simulations that look noticeably different from the creator's live version. Mitigation: test synthesis model quality extensively, consider caching intermediate merged prompts at each ledger entry to reduce synthesis complexity.

2. **Latency in speech-to-sim pipeline**: If the agent takes too long to process speech and inject into the simulation, the creator experience degrades. Mitigation: streaming transcription + fast LLM inference, batch small additions.

3. **Odyssey API cost per fork**: Every viewer fork = a new Interactive Stream instance. At scale, costs could be significant. Mitigation: implement fork limits per session, explore Odyssey pricing tiers, consider "preview" mode before full fork.

4. **Contradictions in the ledger**: Creator says "add rain" then "make it sunny." The synthesis model must handle this. Mitigation: the agent should flag removals/contradictions as separate entry types, and the synthesis model should resolve based on temporal order (latest wins).

5. **Concurrent viewers pulling**: Many viewers hitting "pull" simultaneously creates a burst of Odyssey API calls. Mitigation: queue system for fork requests, rate limiting per session.

---

## 9. MVP Scope

### In Scope (v1)
- Single creator, single session at a time
- Text-based prompt input (type, not speak) for MVP — voice is v2
- "Pull Simulation" creates a viewer fork with merged prompt
- Basic viewer page with embedded stream and pull button
- Session prompt ledger with real-time sync
- Prompt synthesis at pull time

### Out of Scope (v1)
- Voice-to-simulation (ElevenLabs integration) — v2
- Multi-creator sessions
- Fork sharing / social features
- Replay / VOD of sessions
- Mobile apps
- Monetization / payments

---

## 10. Success Metrics

- **Pull-to-render time**: < 10 seconds from button press to viewer seeing their forked simulation
- **Simulation fidelity**: Viewer's forked simulation should contain all elements visible in creator's simulation at pull time
- **Session stability**: Creator's stream stays active for 10+ minutes without interruption
- **Viewer engagement**: % of viewers who use the Pull button

---

## 11. Future Roadmap

- **v2**: Voice-to-simulation pipeline (ElevenLabs transcription + speech-to-sim agent)
- **v3**: Fork sharing — viewers can share their forked simulations with others
- **v4**: Multi-creator collaboration — multiple creators building in the same simulation
- **v5**: Replay system — watch recordings of sessions with pull-at-any-point capability
- **v6**: Marketplace — creators sell access to premium simulation sessions
