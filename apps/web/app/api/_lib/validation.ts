import { z } from "zod";
import { Profession } from "@simistream/types";

const professionValues = Object.values(Profession) as [string, ...string[]];

export const StartTrainingSchema = z.object({
  profession: z.enum(professionValues),
});

export const SubmitResponseSchema = z.object({
  eventId: z.string().uuid(),
  responseText: z.string().min(1).max(5000),
});

export const SessionIdSchema = z.object({
  sessionId: z.string().uuid(),
});
