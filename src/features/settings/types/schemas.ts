import { z } from "zod";

export const SettingsSchema = z.object({
  soundEnabled: z.boolean(),
  volume: z.number().min(0).max(1),
  vibrationEnabled: z.boolean(),
});

export type Settings = z.infer<typeof SettingsSchema>;