"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useOdyssey as useOdysseySDK } from "@odysseyml/odyssey/react";
import type { ConnectionStatus } from "@odysseyml/odyssey";

// Re-export ConnectionStatus so consumers can import from this module
export type { ConnectionStatus };

interface UseOdysseyOptions {
  apiKey: string | null;
  autoConnect?: boolean;
}

const ODYSSEY_API_KEY = process.env.NEXT_PUBLIC_ODYSSEY_API_KEY ?? "";

export function useOdyssey({ apiKey, autoConnect = true }: UseOdysseyOptions) {
  const key = apiKey ?? ODYSSEY_API_KEY;
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const odyssey = useOdysseySDK({
    apiKey: key,
    handlers: {
      onConnected(mediaStream: MediaStream) {
        console.log("[odyssey] Connected, got MediaStream with", mediaStream.getTracks().length, "tracks");
        setIsConnected(true);
      },
      onStreamStarted(streamId: string) {
        console.log("[odyssey] Stream started, streamId:", streamId);
        setIsStreaming(true);
      },
      onStreamEnded() {
        console.log("[odyssey] Stream ended");
        setIsStreaming(false);
      },
      onDisconnected() {
        console.log("[odyssey] Disconnected");
        setIsConnected(false);
        setIsStreaming(false);
      },
      onInteractAcknowledged(prompt: string) {
        console.log("[odyssey] Interaction acknowledged:", prompt.slice(0, 80));
      },
      onStreamError(reason: string, message: string) {
        console.error("[odyssey] Stream error:", reason, message);
      },
      onError(error: Error, fatal: boolean) {
        console.error("[odyssey] Error:", error.message, "fatal:", fatal);
      },
    },
  });

  // Keep a ref so useCallback wrappers never go stale
  const odysseyRef = useRef(odyssey);
  odysseyRef.current = odyssey;

  // Auto-connect on mount
  useEffect(() => {
    if (!key || !autoConnect) return;
    console.log("[odyssey] Auto-connecting...");
    odyssey.connect().catch(() => {});
    return () => {
      console.log("[odyssey] Disconnecting (cleanup)");
      odyssey.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, autoConnect]);

  // Callback ref — uses SDK's attachToVideo (the pattern that was working before)
  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      odysseyRef.current.attachToVideo(el);
      if (el && odysseyRef.current.mediaStream) {
        el.play().catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [odyssey.mediaStream],
  );

  const startStream = useCallback(async (prompt?: string): Promise<string> => {
    console.log("[odyssey] startStream() called, prompt:", prompt?.slice(0, 80));
    const streamId = await odysseyRef.current.startStream({ prompt });
    console.log("[odyssey] startStream() resolved, streamId:", streamId);
    return streamId;
  }, []);

  const interact = useCallback(async (prompt: string): Promise<string> => {
    console.log("[odyssey] interact() called, prompt:", prompt.slice(0, 80));
    const ack = await odysseyRef.current.interact({ prompt });
    console.log("[odyssey] interact() resolved, ack:", ack);
    return ack;
  }, []);

  const endStream = useCallback(async (): Promise<void> => {
    console.log("[odyssey] endStream() called");
    await odysseyRef.current.endStream();
    console.log("[odyssey] endStream() resolved");
  }, []);

  return {
    videoRef,
    status: odyssey.status,
    startStream,
    interact,
    endStream,
    isConnected,
    isStreaming,
    mediaStream: odyssey.mediaStream,
  };
}
