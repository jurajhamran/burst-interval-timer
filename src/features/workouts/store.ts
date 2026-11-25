import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_PREPARE,
  DEFAULT_SKIP_LAST_REST,
  WorkoutSchema,
  type Workout,
} from "@/features/workouts/types/types";
// import { WORKOUT_LIMITS } from "./config";
import { getCopyName } from "./copyName";

export function normalizeWorkout(raw: unknown): Workout | null {
  const result = WorkoutSchema.safeParse(raw);
  if (!result.success) return null;
  return result.data;
}

// function clampInt(value: unknown, min: number, max: number): unknown {
//   if (typeof value !== "number" || !Number.isFinite(value)) return value;
//   return Math.min(max, Math.max(min, Math.round(value)));
// }

// function fitLabel(value: unknown, max: number, fallback: string): unknown {
//   if (typeof value !== "string") return value;
//   const trimmed = value.trim();
//   return (trimmed || fallback).slice(0, max);
// }

/**
 * Clamps data written before the limits were enforced instead of dropping it.
 * Imports and fresh writes go through `normalizeWorkout`, which rejects
 * out-of-range values.
 */
// function sanitizeLegacyWorkout(raw: unknown): unknown {
//   if (typeof raw !== "object" || raw === null) return raw;
//   const workout = raw as Record<string, unknown>;

//   const items = Array.isArray(workout.items)
//     ? workout.items.map((item) => {
//         if (typeof item !== "object" || item === null) return item;
//         const entry = item as Record<string, unknown>;
//         return {
//           ...entry,
//           label:
//             entry.type === "rest"
//               ? "Rest"
//               : fitLabel(
//                   entry.label,
//                   WORKOUT_LIMITS.exerciseName.max,
//                   "Work",
//                 ),
//           duration: clampInt(
//             entry.duration,
//             WORKOUT_LIMITS.itemDuration.min,
//             WORKOUT_LIMITS.itemDuration.max,
//           ),
//         };
//       })
//     : workout.items;

//   const prepare =
//     typeof workout.prepare === "object" && workout.prepare !== null
//       ? {
//           ...(workout.prepare as Record<string, unknown>),
//           duration: clampInt(
//             (workout.prepare as Record<string, unknown>).duration,
//             WORKOUT_LIMITS.prepareDuration.min,
//             WORKOUT_LIMITS.prepareDuration.max,
//           ),
//         }
//       : workout.prepare;

//   const roundRest =
//     typeof workout.roundRest === "object" && workout.roundRest !== null
//       ? {
//           ...(workout.roundRest as Record<string, unknown>),
//           duration: clampInt(
//             (workout.roundRest as Record<string, unknown>).duration,
//             WORKOUT_LIMITS.roundRestDuration.min,
//             WORKOUT_LIMITS.roundRestDuration.max,
//           ),
//         }
//       : workout.roundRest;

//   return {
//     ...workout,
//     name:
//       typeof workout.name === "string"
//         ? workout.name.trim().slice(0, WORKOUT_LIMITS.name.max)
//         : workout.name,
//     rounds: clampInt(
//       workout.rounds,
//       WORKOUT_LIMITS.rounds.min,
//       WORKOUT_LIMITS.rounds.max,
//     ),
//     items,
//     prepare,
//     roundRest,
//   };
// }

interface WorkoutsState {
  workouts: Workout[];
  addWorkout: (w: Workout) => void;
  addWorkouts: (list: Workout[]) => void;
  duplicateWorkout: (id: string) => string | undefined;
  updateWorkout: (w: Workout) => void;
  deleteWorkout: (id: string) => void;
}

const seededWorkouts: Workout[] = [
  {
    id: "seed-hiit",
    name: "Full Body HIIT",
    rounds: 3,
    items: [
      { id: "hiit-a", type: "work", label: "Jumping Jacks", duration: 40 },
      { id: "hiit-b", type: "rest", label: "Rest", duration: 20 },
      { id: "hiit-c", type: "work", label: "Bodyweight Squats", duration: 40 },
      { id: "hiit-d", type: "rest", label: "Rest", duration: 20 },
      { id: "hiit-e", type: "work", label: "Push-ups", duration: 40 },
      { id: "hiit-f", type: "rest", label: "Rest", duration: 20 },
      { id: "hiit-g", type: "work", label: "Reverse Lunges", duration: 40 },
      { id: "hiit-h", type: "rest", label: "Rest", duration: 20 },
      { id: "hiit-i", type: "work", label: "Mountain Climbers", duration: 40 },
      { id: "hiit-j", type: "rest", label: "Rest", duration: 20 },
      { id: "hiit-k", type: "work", label: "Burpees", duration: 40 },
      { id: "hiit-l", type: "rest", label: "Rest", duration: 20 },
    ],
    prepare: { ...DEFAULT_PREPARE },
    roundRest: { enabled: true, duration: 30 },
    skipLastRest: DEFAULT_SKIP_LAST_REST,
  },
  {
    id: "seed-stretch",
    name: "Full Body Stretch",
    rounds: 1,
    items: [
      {
        id: "stretch-1",
        type: "work",
        label: "Neck Stretch (Left)",
        duration: 30,
      },
      { id: "stretch-2", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-3",
        type: "work",
        label: "Neck Stretch (Right)",
        duration: 30,
      },
      { id: "stretch-4", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-5",
        type: "work",
        label: "Standing Chest Opener",
        duration: 30,
      },
      { id: "stretch-6", type: "rest", label: "Rest", duration: 10 },
      { id: "stretch-7", type: "work", label: "Cat-Cow Stretch", duration: 45 },
      { id: "stretch-8", type: "rest", label: "Rest", duration: 10 },
      { id: "stretch-9", type: "work", label: "Child's Pose", duration: 45 },
      { id: "stretch-10", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-11",
        type: "work",
        label: "Thread the Needle (Left)",
        duration: 30,
      },
      { id: "stretch-12", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-13",
        type: "work",
        label: "Thread the Needle (Right)",
        duration: 30,
      },
      { id: "stretch-14", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-15",
        type: "work",
        label: "Kneeling Hip Flexor Stretch (Left)",
        duration: 45,
      },
      { id: "stretch-16", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-17",
        type: "work",
        label: "Kneeling Hip Flexor Stretch (Right)",
        duration: 45,
      },
      { id: "stretch-18", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-19",
        type: "work",
        label: "Butterfly Stretch",
        duration: 30,
      },
      { id: "stretch-20", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-21",
        type: "work",
        label: "Seated Hamstring Stretch (Left)",
        duration: 45,
      },
      { id: "stretch-22", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-23",
        type: "work",
        label: "Seated Hamstring Stretch (Right)",
        duration: 45,
      },
      { id: "stretch-24", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-25",
        type: "work",
        label: "Figure Four Stretch (Left)",
        duration: 45,
      },
      { id: "stretch-26", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-27",
        type: "work",
        label: "Figure Four Stretch (Right)",
        duration: 45,
      },
      { id: "stretch-28", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-29",
        type: "work",
        label: "Standing Quad Stretch (Left)",
        duration: 45,
      },
      { id: "stretch-30", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-31",
        type: "work",
        label: "Standing Quad Stretch (Right)",
        duration: 45,
      },
      { id: "stretch-32", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-33",
        type: "work",
        label: "Calf Stretch (Left)",
        duration: 45,
      },
      { id: "stretch-34", type: "rest", label: "Rest", duration: 10 },
      {
        id: "stretch-35",
        type: "work",
        label: "Calf Stretch (Right)",
        duration: 45,
      },
    ],
    prepare: { enabled: true, duration: 10 },
    roundRest: { enabled: false, duration: 30 },
    skipLastRest: DEFAULT_SKIP_LAST_REST,
  },
  {
    id: "seed-core",
    name: "Core Burner",
    rounds: 4,
    items: [
      { id: "a", type: "work", label: "Plank", duration: 40 },
      { id: "b", type: "rest", label: "Rest", duration: 15 },
      { id: "c", type: "work", label: "Mountain Climbers", duration: 40 },
      { id: "d", type: "rest", label: "Rest", duration: 15 },
      { id: "e", type: "work", label: "Crunches", duration: 40 },
      { id: "f", type: "rest", label: "Rest", duration: 15 },
      { id: "g", type: "work", label: "High Knee Taps", duration: 40 },
      { id: "h", type: "rest", label: "Rest", duration: 15 },
    ],
    prepare: { ...DEFAULT_PREPARE },
    roundRest: { enabled: true, duration: 30 },
    skipLastRest: DEFAULT_SKIP_LAST_REST,
  },
];

interface PersistedState {
  workouts: Workout[];
}

export const useWorkoutsStore = create<WorkoutsState>()(
  persist(
    (set, get) => ({
      workouts: seededWorkouts,
      addWorkout: (w) => set((state) => ({ workouts: [...state.workouts, w] })),
      addWorkouts: (list) =>
        set((state) => ({ workouts: [...state.workouts, ...list] })),
      duplicateWorkout: (id) => {
        const state = get();
        const index = state.workouts.findIndex((w) => w.id === id);
        if (index === -1) return undefined;
        const original = state.workouts[index];
        const newId = crypto.randomUUID();
        const copy: Workout = {
          ...original,
          id: newId,
          name: getCopyName(
            original.name,
            state.workouts.map((w) => w.name),
          ),
          items: original.items.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
          })),
          prepare: { ...original.prepare },
          roundRest: { ...original.roundRest },
        };
        const workouts = [...state.workouts];
        workouts.splice(index + 1, 0, copy);
        set({ workouts });
        return newId;
      },
      updateWorkout: (w) =>
        set((state) => ({
          workouts: state.workouts.map((item) => (item.id === w.id ? w : item)),
        })),
      deleteWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((item) => item.id !== id),
        })),
    }),
    {
      name: "tabata-workouts",
      version: 3,
      migrate: (persistedState: unknown) => {
        const state = persistedState as PersistedState;
        if (state && Array.isArray(state.workouts)) {
          const normalized = state.workouts
            .map((w) => normalizeWorkout(w))
            .filter((w): w is Workout => w !== null);
          state.workouts = normalized;
        }
        return state as WorkoutsState;
      },
    },
  ),
);
