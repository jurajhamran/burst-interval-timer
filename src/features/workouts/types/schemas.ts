import { z } from "zod";

export const DEFAULT_PREPARE = {
  enabled: true,
  duration: 5,
};

export const DEFAULT_ROUND_REST = {
  enabled: false,
  duration: 30,
};

export const DEFAULT_SKIP_LAST_REST = true;

export const ItemTypeSchema = z.enum(["work", "rest"]);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const SessionItemSchema = z.object({
  id: z.string().refine((value) => value.trim().length > 0, {
    message: "id must be a non-empty string",
  }),
  type: ItemTypeSchema,
  label: z.string(),
  duration: z.number().int().min(1).max(3600),
});

export type SessionItem = z.infer<typeof SessionItemSchema>;

export const PrepareConfigSchema = z.object({
  enabled: z.boolean(),
  duration: z.number().int().min(1).max(3600),
});

export type PrepareConfig = z.infer<typeof PrepareConfigSchema>;

export const RoundRestConfigSchema = z.object({
  enabled: z.boolean(),
  duration: z.number().int().min(1).max(3600),
});

export type RoundRestConfig = z.infer<typeof RoundRestConfigSchema>;

export const WorkoutSchema = z.object({
  id: z.string().refine((value) => value.trim().length > 0, {
    message: "id must be a non-empty string",
  }),
  name: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: "Give your workout a name",
    }),
  rounds: z.number().int().min(1).max(99),
  items: z.array(SessionItemSchema).min(1),
  prepare: PrepareConfigSchema.default(DEFAULT_PREPARE),
  roundRest: RoundRestConfigSchema.default(DEFAULT_ROUND_REST),
  skipLastRest: z.boolean().default(DEFAULT_SKIP_LAST_REST),
});

export type Workout = z.infer<typeof WorkoutSchema>;