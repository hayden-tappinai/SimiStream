import Redis from "ioredis";
import { getEnv } from "@simistream/config";
import type { WsEvent } from "@simistream/types";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const env = getEnv();
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
}

export const redis: Redis =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function publishEvent(
  channel: string,
  event: WsEvent,
): Promise<void> {
  await redis.publish(channel, JSON.stringify(event));
}
