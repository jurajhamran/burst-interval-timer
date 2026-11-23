import { z } from "zod";

export const BackupSchema = z.object({
  app: z.literal("tabata-timer"),
  version: z.number(),
  exportedAt: z.string(),
  workouts: z.array(z.unknown()),
  history: z.array(z.unknown()),
});

export type BackupData = z.infer<typeof BackupSchema>;