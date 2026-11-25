import { z } from "zod";
import { WORKOUT_LIMITS } from "../config";

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

const idSchema = z.string().refine((value) => value.trim().length > 0, {
  message: "id must be a non-empty string",
});

export const SessionItemSchema = z
  .object({
    id: idSchema,
    type: ItemTypeSchema,
    label: z.string(),
    duration: z
      .number()
      .int()
      .min(WORKOUT_LIMITS.itemDuration.min)
      .max(WORKOUT_LIMITS.itemDuration.max),
  })
  .superRefine((item, ctx) => {
    if (item.type !== "work") return;
    const label = item.label.trim();
    if (label.length < WORKOUT_LIMITS.exerciseName.min) {
      ctx.addIssue({
        code: "custom",
        path: ["label"],
        message: "Give this exercise a name",
      });
    } else if (label.length > WORKOUT_LIMITS.exerciseName.max) {
      ctx.addIssue({
        code: "custom",
        path: ["label"],
        message: `Exercise name must be ${WORKOUT_LIMITS.exerciseName.max} characters or fewer`,
      });
    }
  })
  // Rest is a fixed phase: its stored label is always "Rest". Work labels are
  // trimmed here so the editor, timer and previews all read the same value.
  .transform((item) => ({
    ...item,
    label: item.type === "rest" ? "Rest" : item.label.trim(),
  }));

export type SessionItem = z.infer<typeof SessionItemSchema>;

export const PrepareConfigSchema = z.object({
  enabled: z.boolean(),
  duration: z
    .number()
    .int()
    .min(WORKOUT_LIMITS.prepareDuration.min)
    .max(WORKOUT_LIMITS.prepareDuration.max),
});

export type PrepareConfig = z.infer<typeof PrepareConfigSchema>;

export const RoundRestConfigSchema = z.object({
  enabled: z.boolean(),
  duration: z
    .number()
    .int()
    .min(WORKOUT_LIMITS.roundRestDuration.min)
    .max(WORKOUT_LIMITS.roundRestDuration.max),
});

export type RoundRestConfig = z.infer<typeof RoundRestConfigSchema>;

export const WorkoutSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .trim()
    .min(WORKOUT_LIMITS.name.min, { message: "Give your workout a name" })
    .max(WORKOUT_LIMITS.name.max, {
      message: `Workout name must be ${WORKOUT_LIMITS.name.max} characters or fewer`,
    }),
  rounds: z
    .number()
    .int()
    .min(WORKOUT_LIMITS.rounds.min)
    .max(WORKOUT_LIMITS.rounds.max),
  items: z.array(SessionItemSchema).min(1),
  prepare: PrepareConfigSchema.default(DEFAULT_PREPARE),
  roundRest: RoundRestConfigSchema.default(DEFAULT_ROUND_REST),
  skipLastRest: z.boolean().default(DEFAULT_SKIP_LAST_REST),
});

export type Workout = z.infer<typeof WorkoutSchema>;
