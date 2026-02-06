# SimiStream — Odyssey-2 Pro Integration Spec

## Overview

Odyssey-2 Pro is the simulation engine behind SimiStream. We use three API endpoints to power the creator experience, viewer broadcast, and fork mechanism.

---

## 1. Odyssey API Endpoints We Use

Based on the Odyssey-2 Pro API documentation (https://documentation.api.odyssey.ml/):

### Interactive Streams
- **Purpose**: Creator builds their simulation in real-time; also used for viewer forks
- **How it works**: Embed an interactive stream of generated video into the application. At any moment, you can programmatically interact with it in real-time.
- **We use it for**:
  - Creator's live simulation session (they interact, we capture)
  - Viewer's forked simulation (they get their own interactive instance)

### Viewable Streams
- **Purpose**: Broadcast a single interactive stream to many viewers
- **How it works**: Distribute a single interactive stream to many users
- **We use it for**:
  - All viewers watching the creator's simulation
  - Read-only embed on the viewer stream page

### Simulations
- **Purpose**: Generate simulations with user-specified actions at precise time steps
- **How it works**: You provide a prompt, a set of actions, quality settings, a target simulation length, and the model returns a video
- **We use it for**:
  - Future: session replays, VOD content
  - Potentially: fork creation (if batch mode is faster/cheaper than Interactive Stream for reconstruction)

---

## 2. Odyssey Client Wrapper

`packages/odyssey-client/src/index.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk"; // example — replace with Odyssey SDK

interface OdysseyConfig {
  apiKey: string;
  baseUrl: string;
}

interface CreateInteractiveStreamParams {
  prompt: string;
  quality?: "standard" | "high";
  // Additional params TBD based on Odyssey SDK
}

interface CreateInteractiveStreamResponse {
  streamId: string;
  embedUrl: string;
  // WebSocket URL for programmatic interaction
  interactionUrl: string;
}

interface CreateViewableStreamParams {
  interactiveStreamId: string;
}

interface CreateViewableStreamResponse {
  viewableStreamId: string;
  embedUrl: string;
}

interface InteractWithStreamParams {
  streamId: string;
  action: string; // The modification to inject
}

class OdysseyClient {
  private config: OdysseyConfig;

  constructor(config: OdysseyConfig) {
    this.config = config;
  }

  // --- Interactive Streams ---

  async createInteractiveStream(
    params: CreateInteractiveStreamParams
  ): Promise<CreateInteractiveStreamResponse> {
    // TODO: Replace with actual Odyssey SDK call
    // Their JS SDK should handle this in ~10 lines
    throw new Error("Implement with Odyssey JS SDK");
  }

  async interactWithStream(
    params: InteractWithStreamParams
  ): Promise<void> {
    // Inject a modification into a live Interactive Stream
    // This is how the agent pipeline pushes additions into the simulation
    throw new Error("Implement with Odyssey JS SDK");
  }

  async endInteractiveStream(streamId: string): Promise<void> {
    throw new Error("Implement with Odyssey JS SDK");
  }

  // --- Viewable Streams ---

  async createViewableStream(
    params: CreateViewableStreamParams
  ): Promise<CreateViewableStreamResponse> {
    throw new Error("Implement with Odyssey JS SDK");
  }

  // --- Simulations (batch) ---

  async createSimulation(params: {
    prompt: string;
    actions?: Array<{ timestep: number; action: string }>;
    quality?: "standard" | "high";
    durationSeconds?: number;
  }): Promise<{ simulationId: string; videoUrl: string }> {
    throw new Error("Implement with Odyssey JS SDK");
  }

  // --- Utilities ---

  async getStreamHealth(streamId: string): Promise<{
    status: "active" | "degraded" | "ended";
    fps: number;
    resolution: string;
  }> {
    throw new Error("Implement with Odyssey JS SDK");
  }
}

export { OdysseyClient };
export type {
  OdysseyConfig,
  CreateInteractiveStreamParams,
  CreateInteractiveStreamResponse,
  CreateViewableStreamParams,
  CreateViewableStreamResponse,
  InteractWithStreamParams,
};
```

### Implementation Notes

- **Use their JavaScript SDK** (`@odyssey/sdk` or whatever their package is called). Their docs say "integrate in 5 minutes or less" with JS and Python SDKs.
- **Retry logic**: wrap all API calls with exponential backoff (3 retries, 1s/2s/4s delays)
- **Error normalization**: catch Odyssey-specific errors and throw typed SimiStream errors
- **Rate limiting**: track API calls per session, implement client-side throttling if needed
- **Stream lifecycle**: create on session start, monitor health, clean up on session end

---

## 3. Integration Points

### Creator Goes Live

```
Creator clicks "Go Live"
        │
        ▼
1. Create Interactive Stream (with base prompt)
   → Get streamId + embedUrl + interactionUrl
        │
        ▼
2. Create Viewable Stream (from interactive streamId)
   → Get viewableStreamId + viewable embedUrl
        │
        ▼
3. Store both stream IDs on Session record
        │
        ▼
4. Return embed URLs to frontend
   → Creator sees Interactive Stream embed
   → Viewers see Viewable Stream embed
```

### Agent Injects Modification

```
Agent extracts "cats" from creator's speech/text
        │
        ▼
1. Write to ledger (see Ledger spec)
        │
        ▼
2. Call odysseyClient.interactWithStream({
     streamId: session.odysseyInteractiveStreamId,
     action: "Add cats roaming around the garden"
   })
        │
        ▼
3. Odyssey processes the interaction
   → Creator's simulation updates in real-time
   → Viewable Stream automatically reflects the change
```

### Viewer Pulls / Forks

```
Viewer clicks "Pull Simulation"
        │
        ▼
1. Synthesize merged prompt from ledger (see Ledger spec)
        │
        ▼
2. Call odysseyClient.createInteractiveStream({
     prompt: mergedPrompt,
     quality: "standard"
   })
   → Get new streamId + embedUrl for viewer
        │
        ▼
3. Store Fork record with new streamId
        │
        ▼
4. Return embedUrl to viewer
   → Viewer's page switches from Viewable Stream to Interactive Stream
   → Viewer can now interact independently
```

### Session Ends

```
Creator clicks "End Session"
        │
        ▼
1. End creator's Interactive Stream
   → Viewable Stream also ends
        │
        ▼
2. Update Session record (status: "ended")
        │
        ▼
3. Notify all connected viewers via WebSocket
        │
        ▼
4. Active viewer forks continue running independently
   (they have their own Interactive Streams)
```

---

## 4. Embedding Odyssey Streams

Based on their SDK, embedding should look something like:

```tsx
// Creator view — Interactive Stream
function CreatorSimulation({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="autoplay; microphone"
        // Or use their SDK component if they provide one
      />
    </div>
  );
}

// Viewer view — Viewable Stream (read-only)
function ViewerSimulation({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="autoplay"
      />
    </div>
  );
}
```

**Note**: Odyssey may provide React components in their SDK rather than iframe embeds. Check their JS SDK docs. The iframe approach is the fallback.

---

## 5. Cost Considerations

| Action | Odyssey API Call | Cost Impact |
|--------|-----------------|-------------|
| Creator goes live | 1 Interactive Stream + 1 Viewable Stream | Fixed per session |
| Viewer watches | None (Viewable Stream handles distribution) | Free (covered by Viewable Stream) |
| Viewer pulls/forks | 1 Interactive Stream per fork | Scales with forks |
| Agent injects modification | Interaction on existing stream | Minimal (part of existing stream) |

**The cost bottleneck is forks.** Every viewer fork creates a new Interactive Stream instance. For a session with 1,000 viewers where 10% pull, that's 100 new Odyssey streams.

**Mitigations:**
- MVP: limit forks per session (e.g., max 50)
- Show estimated wait time if queue is full
- Consider a "preview" feature that shows the merged prompt without actually creating the stream
- Explore Odyssey's pricing tiers for volume discounts

---

## 6. Open Questions for Odyssey Team

These should be answered by reviewing their full SDK docs or asking their team directly:

1. **Can you programmatically read the interaction history from an Interactive Stream?** If yes, the ledger could be derived from Odyssey's own records instead of maintained separately.

2. **What's the latency for creating a new Interactive Stream from a prompt?** This directly determines pull-to-render time.

3. **Is there a state snapshot/clone feature?** Being able to clone an Interactive Stream's current state into a new instance would be faster than prompt reconstruction.

4. **What are the rate limits for Interactive Stream creation?** Determines how many concurrent forks we can support.

5. **Does the Viewable Stream automatically reflect changes to its source Interactive Stream?** Assumed yes, but needs confirmation.

6. **What format does the `interact` call expect?** Natural language prompt? Structured action object? This determines how the agent pipeline formats its injections.

7. **Are there WebSocket events from the stream we can subscribe to?** For health monitoring, state change notifications, etc.
