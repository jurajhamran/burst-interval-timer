import { z } from "zod";

export const HistoryEntrySchema = z.object({
  id: z.string().refine((value) => value.trim().length > 0, {
    message: "id must be a non-empty string",
  }),
  workoutId: z.string().refine((value) => value.trim().length > 0, {
    message: "workoutId must be a non-empty string",
  }),
  workoutName: z.string().refine((value) => value.trim().length > 0, {
    message: "workoutName must be a non-empty string",
  }),
  completedAt: z.number().finite().positive(),
  durationSeconds: z.number().finite().positive(),
  rounds: z.number().int().min(1),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;