/**
 * Previously contained manual type declarations for @odysseyml/odyssey.
 *
 * Removed because the SDK ships its own .d.ts files (dist/index.d.ts and
 * dist/react.d.ts) that are complete and correct. The manual declarations
 * here were overriding the real types with wrong return types (void instead
 * of Promise), which caused interact() and startStream() errors to be
 * silently swallowed.
 *
 * The SDK's exports field in package.json provides:
 *   "."      -> dist/index.d.ts  (Odyssey class, ConnectionStatus, etc.)
 *   "./react" -> dist/react.d.ts  (useOdyssey hook, OdysseyClient, etc.)
 */
export {};
