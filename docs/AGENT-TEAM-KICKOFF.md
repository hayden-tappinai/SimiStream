# SimiStream — Agent Team Kickoff Prompt

## How to Use This Document

Copy the prompt below and paste it into Claude Code after enabling agent teams. This will create a 4-teammate team that builds SimiStream's MVP in parallel.

### Prerequisites

1. Enable agent teams:
```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

2. Make sure CLAUDE.md is in your project root (use the CLAUDE.md from this document set)

3. Have your `.env.local` ready with Odyssey API key, Anthropic API key, and database URL

4. Initialize the monorepo structure first (or let the team do it — see prompt)

---

## The Kickoff Prompt

```
Create an agent team to build SimiStream — a platform where creators build
interactive world simulations (Odyssey-2 Pro API) while streaming, and viewers
can "pull" that simulation to fork and explore independently.

Read CLAUDE.md first for full architecture and conventions.

Spawn 4 teammates:

1. **infra-teammate** — Database, project scaffolding, and shared packages.
   Prompt: "You own project scaffolding and the data layer. Your tasks:
   (a) Initialize the Turborepo monorepo with apps/web (Next.js 14, App Router,
   TypeScript, Tailwind), apps/ws-server (Node.js WebSocket server), packages/db
   (Prisma), packages/types (shared TypeScript types), packages/odyssey-client.
   (b) Create the Prisma schema with models: User, Session, PromptLedgerEntry,
   Fork — see CLAUDE.md and PRD for field definitions.
   (c) Set up the typed config utility for environment variables with Zod validation.
   (d) Create the shared types package with all TypeScript interfaces and enums.
   Signal the team when the schema and types are ready — other teammates depend on this."

2. **backend-teammate** — API routes, WebSocket server, and session management.
   Prompt: "You own the API layer and real-time infrastructure. Wait for
   infra-teammate to finish the schema and types before starting implementation.
   Your tasks:
   (a) Build REST API routes in apps/web/app/api/: sessions CRUD, ledger read
   endpoints, fork creation endpoint.
   (b) Build the WebSocket server in apps/ws-server/ with Redis pub/sub for
   real-time ledger sync. Handle events: ledger:update, session:status,
   fork:created, stream:health.
   (c) Implement the fork flow: when POST /api/sessions/:id/fork is called,
   read the ledger, call the prompt synthesis function, call Odyssey to create
   a new Interactive Stream, store the fork record, and return stream details.
   (d) Add Zod validation on all API inputs.
   You depend on: infra-teammate (schema + types), odyssey-teammate (Odyssey client + synthesizer)."

3. **odyssey-teammate** — Odyssey API integration and the AI agent pipeline.
   Prompt: "You own all Odyssey API integration and the AI agent pipeline.
   Your tasks:
   (a) Build packages/odyssey-client/ — a typed wrapper around Odyssey's three
   endpoints: Interactive Streams (create, interact, end), Viewable Streams
   (create from interactive stream, get embed URL), and Simulations (create with
   prompt + actions). Use their JavaScript SDK if available, otherwise build
   REST client. Include retry logic and error handling.
   (b) Build services/agent/src/prompt-synthesizer.ts — takes an array of
   LedgerEntry objects (base_prompt + ordered additions/removals) and returns
   a single coherent merged prompt string. Use Claude API to do the synthesis.
   Handle contradictions (latest wins), ordering, and prompt length limits.
   (c) Build services/agent/src/transcription-parser.ts — takes raw transcription
   text and extracts actionable scene modifications. Returns structured additions
   like { action: 'add' | 'remove' | 'modify', content: string }. This is for
   v2 voice support but build the parser now.
   (d) Build services/agent/src/odyssey-injector.ts — takes a parsed addition and
   injects it into a live Odyssey Interactive Stream session.
   Signal the team when the Odyssey client and synthesizer are ready — backend
   teammate needs them for the fork flow."

4. **frontend-teammate** — All UI components and pages.
   Prompt: "You own the entire frontend in apps/web/. Wait for infra-teammate
   to finish types before building components. Your tasks:
   (a) Build the creator dashboard page: session creation form (title + initial
   prompt input), list of past sessions, and a 'Go Live' button.
   (b) Build the creator live view: embedded Odyssey Interactive Stream (use an
   iframe or their SDK embed), a sidebar showing the prompt ledger entries in
   real-time (via WebSocket), and a text input for adding modifications manually
   (voice is v2).
   (c) Build the viewer stream page: embedded Odyssey Viewable Stream, the
   'Pull Simulation' button (prominent, always visible), a real-time display
   of the current ledger state so viewers can see what's been added.
   (d) Build the fork view: embedded Odyssey Interactive Stream for the viewer's
   fork, text input for viewer's own modifications, a 'back to stream' button.
   (e) Build shared UI components: navigation, session cards, loading states,
   error boundaries.
   Use server components by default. Use Tailwind for all styling. Use shadcn/ui
   for base primitives where it makes sense.
   You depend on: infra-teammate (types), backend-teammate (API routes to call)."

CRITICAL — Dependency Handoff Protocol:
When a teammate finishes work that other teammates depend on, the lead MUST:
1. Message the completed teammate: "List every file you created or modified"
2. Message each dependent teammate with those exact file paths and say:
   "Before starting implementation, read these files that [teammate] just
   finished. Use the Read tool on each file. These are your source of truth
   for types, schemas, and interfaces. Do not assume — read the actual files."

Specifically:
- When infra-teammate finishes → tell backend-teammate, odyssey-teammate,
  and frontend-teammate to read: packages/types/index.ts,
  packages/db/prisma/schema.prisma, and any config utilities created.
- When odyssey-teammate finishes the client + synthesizer → tell
  backend-teammate to read: packages/odyssey-client/src/index.ts,
  services/agent/src/prompt-synthesizer.ts
- When backend-teammate finishes API routes → tell frontend-teammate to
  read the route files in apps/web/app/api/ so component API calls match
  the actual signatures.

Each dependent teammate should CONFIRM they've read the files before
proceeding. If a teammate starts implementing without reading dependencies,
stop them and redirect.

Use Opus for the lead. Use Sonnet for all teammates.

Require plan approval for all teammates before they start implementing.
Only approve plans that:
- Respect file ownership boundaries in CLAUDE.md
- Include proper TypeScript types for all functions and components
- Don't duplicate logic that belongs in another teammate's domain

Use delegate mode — do not implement anything yourself. Focus entirely on
coordination, plan review, and synthesizing results.

Create 5-6 tasks per teammate. Dependencies:
- infra-teammate has no dependencies (starts immediately)
- All other teammates depend on infra-teammate completing the schema + types
- backend-teammate depends on odyssey-teammate for the Odyssey client and synthesizer
- frontend-teammate depends on backend-teammate for API route signatures

After all teammates complete their tasks, review the integration points:
1. Frontend API calls match backend route signatures
2. WebSocket events match between ws-server and frontend hooks
3. Odyssey client is used correctly in the fork flow
4. Prompt synthesizer handles edge cases (empty ledger, single entry, contradictions)
```

---

## What to Watch For

### During the Build

- **infra-teammate should finish first.** If it's slow, nudge it. Everyone else is blocked.
- **File conflicts**: If two teammates try to edit `packages/types/index.ts` simultaneously, intervene. Only one should write at a time, coordinated through the lead.
- **Odyssey API specifics**: The odyssey-teammate may need to reference the actual SDK docs. You can message them directly with links or paste in SDK code examples.
- **Frontend calling nonexistent APIs**: The frontend-teammate might build components that call API routes before backend-teammate creates them. This is fine — they can use typed stubs. Just make sure signatures match at integration time.

### After the Build

Run through this checklist with the lead:

1. `turbo build` passes across all packages
2. Prisma schema generates without errors
3. API routes return proper typed responses
4. WebSocket server connects and emits typed events
5. Odyssey client compiles and has proper error handling
6. Prompt synthesizer handles: empty ledger, single base prompt only, 20+ additions, contradictions
7. Frontend pages render without errors
8. All imports between packages resolve correctly

---

## Alternative: Simpler 2-Teammate Approach

If you want to start smaller or save tokens:

```
Create an agent team with 2 teammates:

1. **backend-teammate** — Everything server-side: scaffolding, database, API
   routes, WebSocket server, Odyssey client, agent pipeline.

2. **frontend-teammate** — Everything client-side: all pages, components,
   hooks, styles.

Read CLAUDE.md first. Backend starts immediately with scaffolding.
Frontend waits for types to be ready before building components.
```

This uses fewer tokens but loses the parallelism benefit on the backend/infrastructure work.
