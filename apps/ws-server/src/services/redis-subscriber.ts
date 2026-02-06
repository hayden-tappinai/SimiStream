import Redis from "ioredis";
import { getEnv } from "@simistream/config";
import type { WsEvent, WsEventType } from "@simistream/types";

type MessageHandler = (event: WsEvent) => void;

interface ChannelSubscription {
  refCount: number;
  handlers: Set<MessageHandler>;
}

let subscriber: Redis | null = null;
const subscriptions = new Map<string, ChannelSubscription>();

function getSubscriber(): Redis {
  if (!subscriber) {
    const env = getEnv();
    subscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });

    subscriber.on("message", (channel: string, message: string) => {
      const sub = subscriptions.get(channel);
      if (!sub) return;

      try {
        const event = JSON.parse(message) as WsEvent;
        for (const handler of sub.handlers) {
          handler(event);
        }
      } catch (err) {
        console.error(
          `[redis-subscriber] Failed to parse message on ${channel}:`,
          err,
        );
      }
    });

    subscriber.on("error", (err) => {
      console.error("[redis-subscriber] Redis error:", err);
    });
  }
  return subscriber;
}

export async function subscribe(
  channel: string,
  handler: MessageHandler,
): Promise<void> {
  const sub = getSubscriber();
  const existing = subscriptions.get(channel);

  if (existing) {
    existing.refCount++;
    existing.handlers.add(handler);
    return;
  }

  subscriptions.set(channel, { refCount: 1, handlers: new Set([handler]) });
  await sub.subscribe(channel);
  console.log(`[redis-subscriber] Subscribed to ${channel}`);
}

export async function unsubscribe(
  channel: string,
  handler: MessageHandler,
): Promise<void> {
  const existing = subscriptions.get(channel);
  if (!existing) return;

  existing.handlers.delete(handler);
  existing.refCount--;

  if (existing.refCount <= 0) {
    subscriptions.delete(channel);
    const sub = getSubscriber();
    await sub.unsubscribe(channel);
    console.log(`[redis-subscriber] Unsubscribed from ${channel}`);
  }
}

export async function cleanup(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
  subscriptions.clear();
}
