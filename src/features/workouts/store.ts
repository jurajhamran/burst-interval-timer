import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_PREPARE,
  DEFAULT_ROUND_REST,
  DEFAULT_SKIP_LAST_REST,
  type Workout,
  type SessionItem,
  type PrepareConfig,
  type RoundRestConfig,
} from "@/features/workouts/types";
import { getCopyName } from "./copyName";

export function normalizeWorkout(raw: unknown): Workout | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.id !== "string" || r.id.trim() === "") return null;
  if (typeof r.name !== "string" || r.name.trim() === "") return null;
  if (!Number.isInteger(r.rounds)) return null;
  const rounds = r.rounds as number;
  if (rounds < 1 || rounds > 99) return null;

  if (!Array.isArray(r.items) || r.items.length === 0) return null;
  const items: SessionItem[] = [];
  for (const rawItem of r.items) {
    if (typeof rawItem !== "object" || rawItem === null) return null;
    const it = rawItem as Record<string, unknown>;
    if (typeof it.id !== "string" || it.id.trim() === "") return null;
    if (it.type !== "work" && it.type !== "rest") return null;
    if (typeof it.label !== "string") return null;
    if (!Number.isInteger(it.duration)) return null;
    const duration = it.duration as number;
    if (duration < 1 || duration > 3600) return null;
    items.push({
      id: it.id,
      type: it.type,
      label: it.label,
      duration,
    });
  }

  let prepare: PrepareConfig = { ...DEFAULT_PREPARE };
  if (r.prepare !== undefined) {
    if (typeof r.prepare !== "object" || r.prepare === null) return null;
    const p = r.prepare as Record<string, unknown>;
    if (typeof p.enabled !== "boolean") return null;
    if (!Number.isInteger(p.duration)) return null;
    const pd = p.duration as number;
    if (pd < 1 || pd > 3600) return null;
    prepare = { enabled: p.enabled, duration: pd };
  }

  let roundRest: RoundRestConfig = { ...DEFAULT_ROUND_REST };
  if (r.roundRest !== undefined) {
    if (typeof r.roundRest !== "object" || r.roundRest === null) return null;
    const rr = r.roundRest as Record<string, unknown>;
    if (typeof rr.enabled !== "boolean") return null;
    if (!Number.isInteger(rr.duration)) return null;
    const rd = rr.duration as number;
    if (rd < 1 || rd > 3600) return null;
    roundRest = { enabled: rr.enabled, duration: rd };
  }

  let skipLastRest: boolean = DEFAULT_SKIP_LAST_REST;
  if (r.skipLastRest !== undefined) {
    if (typeof r.skipLastRest !== "boolean") return null;
    skipLastRest = r.skipLastRest;
  }

  return {
    id: r.id,
    name: r.name.trim(),
    rounds,
    items,
    prepare,
    roundRest,
    skipLastRest,
  };
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
