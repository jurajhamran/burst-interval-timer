/**
 * Single source of truth for workout limits.
 *
 * Both the Zod schemas (storage, migration, backup import) and the editor UI
 * read from here, so an imported workout can never contain a value the editor
 * is unable to produce. Keep this file dependency-free.
 */
export const WORKOUT_LIMITS = {
  name: { min: 1, max: 50 },
  rounds: { min: 1, max: 99 },
  exerciseName: { min: 1, max: 60 },
  itemDuration: { min: 5, max: 3600, step: 5 },
  prepareDuration: { min: 1, max: 60, step: 5, stepperMin: 5 },
  roundRestDuration: { min: 1, max: 300, step: 5 },
} as const;
