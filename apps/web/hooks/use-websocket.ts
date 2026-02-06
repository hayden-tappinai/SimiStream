"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { WsEvent, WsEventType } from "@simistream/types";

type EventHandler = (event: WsEvent) => void;

interface UseWebSocketOptions {
  sessionId: string;
  onEvent?: EventHandler;
  eventTypes?: WsEventType[];
}

interface UseWebSocketReturn {
  connected: boolean;
  send: (data: unknown) => void;
}

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

export function useWebSocket({
  sessionId,
  onEvent,
  eventTypes,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelayRef = useRef(RECONNECT_DELAY_MS);
  const onEventRef = useRef(onEvent);
  const eventTypesRef = useRef(eventTypes);
  const [connected, setConnected] = useState(false);

  // Keep refs in sync
  onEventRef.current = onEvent;
  eventTypesRef.current = eventTypes;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_BASE}/sessions/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectDelayRef.current = RECONNECT_DELAY_MS;
    };

    ws.onmessage = (event) => {
      try {
        const parsed: WsEvent = JSON.parse(event.data);
        const types = eventTypesRef.current;
        if (types && !types.includes(parsed.type)) return;
        onEventRef.current?.(parsed);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect with exponential backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY_MS
        );
        connect();
      }, reconnectDelayRef.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
