# SimiStream — Next Session Kickoff Prompt

Copy everything below the line and paste it into a fresh Claude Code session.

---

```
cd "/Volumes/Extreme SSD/SimiStream"

Read CLAUDE.md first — it has the full project overview, tech stack, and a "Build Status"
section showing exactly what's done and what's not.

## What's Been Built
The full codebase is scaffolded (~98 files, zero TS errors):
- Turborepo monorepo with 7 workspaces
- Shared types, Prisma schema, typed config
- Odyssey API client with retry logic and typed errors
- Agent service (prompt synthesizer, transcription parser, odyssey injector)
- 7 REST API routes with Zod validation
- WebSocket server with Redis pub/sub
- Full frontend: 4 views (dashboard, live view, viewer stream, fork view)
- Minimal neobrutalism dark UI (indigo accents, offset shadows)

## What Needs to Be Done Now

### Phase 1: Connect the Infrastructure
1. **Supabase (PostgreSQL)** — I have a Supabase project. Set up the connection:
   - Create `.env.local` with my Supabase DATABASE_URL (I'll provide it)
   - Run `prisma db push` to create tables
   - Verify Prisma can connect

2. **Redis** — Set up Upstash Redis (or local):
   - Get REDIS_URL into `.env.local`
   - Verify pub/sub works between API routes and WebSocket server

3. **Odyssey API** — I have my API key. Wire the real SDK:
   - Replace REST placeholders in `packages/odyssey-client/src/streams.ts` with actual
     Odyssey SDK calls (check https://documentation.api.odyssey.ml/)
   - Test: create an Interactive Stream, create a Viewable Stream, interact with a stream

### Phase 2: Voice-to-Simulation Pipeline (Core Feature)
This is the main thing that makes SimiStream special. The flow:
1. Creator speaks while streaming
2. ElevenLabs transcribes audio in real-time (WebSocket)
3. Our agent (Claude API) parses the transcription and extracts actionable modifications
   (e.g., "add cats", "remove rain", "make it sunset")
4. Each modification is:
   - Written to the Session Prompt Ledger (PostgreSQL)
   - Published via Redis pub/sub to all viewers
   - Injected into the live Odyssey Interactive Stream

Build this pipeline end-to-end:
- ElevenLabs real-time transcription integration (their WebSocket API)
- Wire `services/agent/src/transcription-parser.ts` to receive live transcription chunks
- Wire `services/agent/src/odyssey-injector.ts` to inject into live streams
- Add a new API route or WebSocket handler for the transcription webhook
- Test the full loop: speech → transcription → parse → ledger write → Odyssey injection

### Phase 3: End-to-End Integration
- Test the full creator flow: create session → go live → speak → see modifications
- Test the viewer flow: watch stream → see ledger update in real-time → pull simulation → get fork
- Test the fork flow: viewer gets independent Interactive Stream with merged prompt

### Phase 4: Auth
- Configure NextAuth.js with a provider (GitHub or email/password for MVP)
- Replace the `x-user-id` header placeholder in API routes with real auth

## Agent Team Setup (if using teams)
Spawn with bypassPermissions mode, NOT plan mode (plan mode has a bug where agents
get stuck in approval loops). Recommended team:

1. **integration-teammate** — Supabase setup, Redis setup, Odyssey SDK wiring
2. **voice-pipeline-teammate** — ElevenLabs integration, transcription → agent → injection loop
3. **frontend-teammate** — Wire real API calls, test UI with live data, fix any issues

File ownership:
- integration-teammate: packages/odyssey-client/, packages/config/, .env.local setup
- voice-pipeline-teammate: services/agent/, apps/ws-server/ (transcription handler)
- frontend-teammate: apps/web/ components and hooks

## My API Keys
I have ready:
- Odyssey API key
- Anthropic API key
- ElevenLabs API key
- Supabase project URL + anon key + service role key
```
