"use client";

import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/hooks/use-odyssey";

interface OdysseyStreamProps {
  videoRef: React.RefCallback<HTMLVideoElement> | React.RefObject<HTMLVideoElement>;
  status: ConnectionStatus;
  className?: string;
}

const statusLabels: Record<ConnectionStatus, string> = {
  authenticating: "Authenticating...",
  connecting: "Connecting to Odyssey...",
  reconnecting: "Reconnecting...",
  connected: "",
  disconnected: "Disconnected",
  failed: "Connection failed",
};

export function OdysseyStream({ videoRef, status, className }: OdysseyStreamProps) {
  const showOverlay = status !== "connected";

  return (
    <div className={cn("relative overflow-hidden border-2 border-border bg-black", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-2">
            {(status === "connecting" || status === "reconnecting" || status === "authenticating") && (
              <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            )}
            <span className="text-sm font-mono text-muted-foreground">
              {statusLabels[status]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
