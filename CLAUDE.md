# SimDrill — CLAUDE.md

## Project Overview

SimDrill is an AI-powered training platform for high-stakes professions. Trainees select a profession (ICU Nurse, Paramedic, Line Cook, Air Traffic Controller, etc.), enter a realistic Odyssey-2 Pro simulation of their work environment, and face randomized scenario events that test their decision-making under pressure. An AI evaluator scores their responses in real time. The core innovation is the **Scenario Injection Engine** — a system that generates contextual crises at unpredictable intervals, evaluates trainee responses via Claude, and drives the Odyssey simulation to reflect the evolving scenario.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, TypeScript
- **Backend**: Next.js API routes + standalone WebSocket server (Node.js)
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache/Pub-Sub**: Redis
- **World Simulation**: Odyssey-2 Pro API (Interactive Streams via WebRTC browser SDK)
- **LLM**: Claude API (Anthropic) for response evaluation + scenario generation
- **Voice**: ElevenLabs for real-time speech-to-text (trainee voice commands)
- **Auth**: Supabase Auth
- **Deployment**: Vercel (frontend) + Railway/Fly.io (WebSocket server + workers)

## Project Structure

```
simdrill/
├── apps/
│   ├── web/                    # Next.js frontend + API routes
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, signup pages
│   │   │   ├── (dashboard)/    # Trainee dashboard, profession selection
│   │   │   ├── (training)/     # Active training session view
│   │   │   ├── (results)/      # Post-session results and scoring
│   │   │   ├── api/            # REST API routes
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── training/       # Training session components
│   │   │   ├── dashboard/      # Dashboard & selection components
│   │   │   ├── shared/         # Shared UI components
│   │   │   └── ui/             # Base UI primitives
│   │   ├── lib/
│   │   │   ├── odyssey/        # Odyssey API client
│   │   │   ├── scenario/       # Scenario event utilities
│   │   │   └── db/             # Prisma client + queries
│   │   └── hooks/              # React hooks
│   │
│   └── ws-server/              # Standalone WebSocket server
│       ├── src/
│       │   ├── handlers/       # WebSocket event handlers
│       │   ├── services/       # Scenario injection, scoring
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── db/                     # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── index.ts
│   ├── types/                  # Shared TypeScript types
│   │   ├── index.ts            # Enums, interfaces, API types, WS events
│   │   └── industries.ts       # Static industry/profession/event configs
│   ├── config/                 # Typed env config (Zod)
│   │   └── index.ts
│   └── odyssey-client/         # Odyssey API wrapper
│       ├── src/
│       │   ├── streams.ts
│       │   ├── simulations.ts
│       │   └── types.ts
│       └── index.ts
│
├── services/
│   └── agent/                  # Scenario injection + evaluation agent
│       ├── src/
│       │   ├── scenario-injector.ts   # Generates and injects events
│       │   ├── response-evaluator.ts  # Claude evaluates trainee responses
│       │   ├── score-calculator.ts    # Aggregates scoring
│       │   └── index.ts
│       └── package.json
│
├── CLAUDE.md                   # This file
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
└── .env.example
```

## Architecture Principles

1. **Scenario events drive the simulation.** The Scenario Injection Engine generates events (patient crises, equipment failures, order rushes) at timed intervals. Each event is logged to the database, sent to the trainee via WebSocket, and applied to the Odyssey simulation as a prompt change.

2. **AI evaluates responses, not rules.** When a trainee responds to an event, Claude evaluates the response for clinical/professional accuracy, assigns an outcome (optimal/acceptable/suboptimal/critical_error), and provides feedback. No hardcoded rubrics — the LLM understands professional context.

3. **Odyssey is the simulation engine. We never build simulation logic.** All world generation and visual updates run through Odyssey's WebRTC API. Our job is orchestration, event injection, response evaluation, and scoring.

4. **Real-time sync via WebSocket + Redis pub/sub.** Events flow from the scenario engine → PostgreSQL → Redis pub/sub → WebSocket → trainee client. Score updates and session status changes follow the same path.

5. **Static profession configs define the scenario space.** Each profession has a `baseScenarioPrompt` (Odyssey environment setup) and `eventTemplates[]` (possible crises). The injection engine selects and parameterizes templates at runtime.

## Coding Conventions

- Use TypeScript strict mode everywhere
- Use Prisma for all database access — no raw SQL
- Use Zod for all API input validation
- Server components by default in Next.js; use `"use client"` only when needed
- Name files with kebab-case: `scenario-injector.ts`, not `scenarioInjector.ts`
- Name components with PascalCase: `EventCard.tsx`
- All API routes return typed responses using shared types from `packages/types`
- Use `async/await` consistently, never raw Promises with `.then()`
- Error handling: always catch at the boundary (API route or component), log with context
- Environment variables: all in `.env.local`, accessed via a typed config utility

## Key Patterns

### Odyssey API Calls
Always go through `packages/odyssey-client`. Never call Odyssey endpoints directly from components or API routes. The client handles auth, retries, and error normalization. Note: Odyssey is WebRTC-based — interactive streaming is client-side via `@odysseyml/odyssey` browser SDK. Server-side is recordings and simulations only.

### Scenario Injection
The scenario engine lives in `services/agent/src/scenario-injector.ts`. It:
1. Reads the profession's `eventTemplates[]` from `packages/types/industries.ts`
2. Selects an appropriate event based on timing, severity escalation, and variety
3. Parameterizes the template (fills in bed numbers, names, specific details via Claude)
4. Writes the `ScenarioEvent` to the database
5. Publishes via Redis for WebSocket broadcast
6. Sends the `odysseyPrompt` to update the simulation visuals

### Response Evaluation
When a trainee submits a response to an event, `services/agent/src/response-evaluator.ts`:
1. Sends the event context + trainee response to Claude
2. Claude returns an outcome (optimal/acceptable/suboptimal/critical_error), score impact, and feedback
3. The `TraineeResponse` is saved with the evaluation
4. The running score is updated and broadcast

### WebSocket Events
All WebSocket events use a typed event system:
```typescript
type WsEvent =
  | { type: "scenario:event"; data: ScenarioEventPayload }
  | { type: "scenario:update"; data: ScenarioUpdatePayload }
  | { type: "score:update"; data: ScoreUpdatePayload }
  | { type: "session:status"; data: SessionStatusPayload }
  | { type: "simulation:prompt"; data: SimulationPromptPayload }
```

## Environment Variables

```
# Odyssey
ODYSSEY_API_KEY=

# Anthropic (Claude)
ANTHROPIC_API_KEY=

# ElevenLabs (v2)
ELEVENLABS_API_KEY=

# Database
DATABASE_URL=
DIRECT_URL=

# Redis
REDIS_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WebSocket
WS_SERVER_URL=
WS_SERVER_PORT=
```

## Agent Team File Ownership

When using Claude Code agent teams, respect these boundaries to prevent file conflicts:

- **Schema/types teammate**: owns `packages/types/`, `packages/db/`, `packages/config/`, `CLAUDE.md`
- **Frontend teammate**: owns `apps/web/` — all components, pages, hooks, styles
- **Backend teammate**: owns `apps/web/app/api/`, `apps/ws-server/`
- **Simulation teammate**: owns `services/agent/`, `packages/odyssey-client/`
- **Shared types**: `packages/types/` — coordinate changes through the lead, never edit in parallel

## Agent Team Dependency Handoff Protocol

Teammates have independent context windows. They cannot see each other's work unless they read the files. When a teammate completes work that others depend on, the lead must enforce this protocol:

1. **Get the file list.** Message the completed teammate: "List every file you created or modified."
2. **Push files to dependents.** Message each waiting teammate with the exact file paths and instruct them: "Read these files before you start. Use the Read tool on each one. These are your source of truth."
3. **Confirm before proceeding.** The dependent teammate must confirm they have read the files before the lead approves their plan or lets them start implementing.

### Dependency chain:

```
schema-agent (types, schema, config)
    │
    ├──▶ simulation-agent (reads types → builds scenario injection + evaluation)
    │        │
    │        └──▶ backend-agent (reads types + simulation engine → builds API routes)
    │                 │
    │                 └──▶ frontend-agent (reads types + API routes → builds UI)
    │
    ├──▶ frontend-agent (reads types → can start shared UI components early)
    │
    └──▶ backend-agent (reads types → can start WebSocket server early)
```

### Critical files that must be read at each handoff:

| When this finishes... | These teammates read these files... |
|---|---|
| schema-agent | ALL teammates read: `packages/types/index.ts`, `packages/types/industries.ts`, `packages/db/prisma/schema.prisma` |
| simulation-agent | backend-agent reads: `services/agent/src/scenario-injector.ts`, `services/agent/src/response-evaluator.ts` |
| backend-agent | frontend-agent reads: all files in `apps/web/app/api/` |

**Never approve a teammate's implementation plan if they haven't confirmed reading their dependency files.**

## Build Status (as of Feb 5, 2026 — Session 3: SimDrill Rebrand)

### DONE — Schema & Types Rewritten for Training Domain
- **Shared types** (`packages/types/index.ts`): All new enums (Industry, Profession, SessionStatus, EventSeverity, EventType, ResponseOutcome), interfaces (User, TrainingSession, ScenarioEvent, TraineeResponse, SessionScore), API types, WebSocket events
- **Static profession data** (`packages/types/industries.ts`): 12 professions across 6 industries, each with baseScenarioPrompt and 10 event templates. Lookup helpers included.
- **Prisma schema** (`packages/db/prisma/schema.prisma`): New models (User with industry/profession fields, TrainingSession, ScenarioEvent, TraineeResponse, SessionScore). Old models removed (Session, PromptLedgerEntry, Fork).
- **DB exports** (`packages/db/index.ts`): Updated to export new Prisma enums
- **Config** (`packages/config/index.ts`): Unchanged — all env vars still applicable
- **Branding**: package.json name → "simdrill", layout.tsx metadata updated, CLAUDE.md rewritten

### IN PROGRESS — Building on new schema
- Frontend UI redesign for training flow
- Backend API routes for training sessions
- Scenario injection simulation engine
- Response evaluation pipeline

### NOT DONE — Needs future sessions
- **Prisma db push**: Schema written but NOT pushed to Supabase yet. Run `npx prisma db push` when ready.
- **End-to-end integration testing**: Full training flow (select profession → start session → receive events → respond → get scored)
- **Install `@odysseyml/odyssey` npm package**: WebRTC SDK for browser-side streaming
- **Production deployment**: Vercel (frontend), Railway/Fly.io (ws-server)

### Architecture Notes
- **Odyssey is client-side WebRTC**: Server cannot interact with Odyssey streams directly. All stream creation and interaction happens in the browser via `@odysseyml/odyssey`. Server manages session state, events, and scoring.
- **Scenario injection flow**: Timer/engine selects event template → Claude parameterizes it → ScenarioEvent saved to DB → Redis pub/sub → WS broadcast to trainee → Odyssey prompt updated client-side
- **Response evaluation flow**: Trainee submits response → Claude evaluates → TraineeResponse saved with outcome + feedback → score recalculated → score:update broadcast
- **Prisma + Supabase**: Use `DIRECT_URL` (port 5432, session mode pooler) for `prisma db push` / migrations. Use `DATABASE_URL` (port 6543 + pgbouncer) for runtime.

### Known Issues
- Prisma enums vs Types package enums: Routes that use both Prisma and types need to import from both packages. DB enums are lowercase strings, TS enums are UPPER_CASE.
- Supabase region: Project is in `aws-1-us-east-2`

### Agent Team Lessons
- **Plan mode loops**: Agents in `plan` mode can get stuck resubmitting plans. Fix: respawn with `bypassPermissions` mode instead.
- **Shutdown done agents**: Agents that finish their work keep sending idle notifications. Shut them down immediately.
- **4 agents is the sweet spot**: schema, frontend, backend, simulation. Schema finishes first, unblocking all others.
- **Region matters**: Supabase pooler URLs encode the region. Getting it wrong gives "Tenant or user not found".

## Testing

- Unit tests: Vitest, colocated with source files (`*.test.ts`)
- API tests: supertest for route testing
- E2E tests: Playwright (v2, not MVP)
- Test naming: `describe("ComponentOrFunction", () => { it("should do X when Y", ...) })`

## Common Tasks

### Add a new API endpoint
1. Create route in `apps/web/app/api/`
2. Add Zod schema for input validation
3. Add types to `packages/types`
4. Implement handler using Prisma for DB access
5. Test with supertest

### Add a new profession
1. Add enum value to `Profession` in `packages/types/index.ts`
2. Add matching enum value in `packages/db/prisma/schema.prisma`
3. Create `ProfessionConfig` object in `packages/types/industries.ts` with baseScenarioPrompt and eventTemplates
4. Add to the appropriate industry's professions array in `INDUSTRIES`
5. Run `prisma db push` to update the database

### Add a new event type
1. Add enum value to `EventType` in `packages/types/index.ts`
2. Add matching enum value in `packages/db/prisma/schema.prisma`
3. Add event templates using the new type to relevant professions in `industries.ts`
4. Update the scenario injector if new injection logic is needed
5. Run `prisma db push` to update the database

### Add a new frontend page
1. Create page in `apps/web/app/(group)/page.tsx`
2. Use server components by default
3. Client components go in `apps/web/components/`
4. Use shared UI primitives from `components/ui/`
