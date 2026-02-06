import { z } from "zod";

const envSchema = z.object({
  // Odyssey
  ODYSSEY_API_KEY: z.string().min(1),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),

  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // WebSocket
  WS_SERVER_URL: z.string().min(1),
  WS_SERVER_PORT: z.coerce.number().int().positive().default(3001),

  // General
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const missing = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(", ")}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${missing}`);
  }
  return result.data;
}

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = parseEnv();
  }
  return _env;
}

export { envSchema };
