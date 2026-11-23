import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_PREPARE,
  DEFAULT_SKIP_LAST_REST,
  WorkoutSchema,
  type Workout,
} from "@/features/workouts/types/types";
import { getCopyName } from "./copyName";

export function normalizeWorkout(raw: unknown): Workout | null {
  const result = WorkoutSchema.safeParse(raw);
  if (!result.success) return null;
  return result.data;
}

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
      addWorkout: (w) =>
        set((state) => ({ workouts: [...state.workouts, w] })),
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
          workouts: state.workouts.map((item) =>
            item.id === w.id ? w : item
          ),
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
    }
  )
);
