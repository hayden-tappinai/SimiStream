import Redis from "ioredis";
import { getEnv } from "@simistream/config";

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    const env = getEnv();
    publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });

    publisher.on("error", (err) => {
      console.error("[redis-publisher] Redis error:", err);
    });
  }
  return publisher;
}

export async function publish(channel: string, data: unknown): Promise<void> {
  const pub = getPublisher();
  await pub.publish(channel, JSON.stringify(data));
}

export async function cleanupPublisher(): Promise<void> {
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
}
