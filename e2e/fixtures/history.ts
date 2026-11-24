import type { HistoryEntry } from "../../src/features/history/types/types";

const now = Date.now();

export const historyEntries: HistoryEntry[] = [
  {
    id: "e2e-history-1",
    workoutId: "seed-core",
    workoutName: "Core Burner",
    completedAt: now - 60_000,
    durationSeconds: 960,
    rounds: 4,
  },
  {
    id: "e2e-history-2",
    workoutId: "seed-core",
    workoutName: "Morning Mobility",
    completedAt: now - 120_000,
    durationSeconds: 300,
    rounds: 2,
  },
];

const DAY = 86_400_000;

/** Spread across days so the charts have a shape to draw. */
export const historySpread: HistoryEntry[] = [
  {
    id: "e2e-spread-1",
    workoutId: "seed-core",
    workoutName: "Core Burner",
    completedAt: now - 2 * 3_600_000,
    durationSeconds: 960,
    rounds: 4,
  },
  {
    id: "e2e-spread-2",
    workoutId: "seed-mobility",
    workoutName: "Morning Mobility",
    completedAt: now - DAY,
    durationSeconds: 300,
    rounds: 2,
  },
  {
    id: "e2e-spread-3",
    workoutId: "seed-core",
    workoutName: "Core Burner",
    completedAt: now - 3 * DAY,
    durationSeconds: 600,
    rounds: 3,
  },
  {
    id: "e2e-spread-4",
    workoutId: "seed-hiit",
    workoutName: "HIIT Blast",
    completedAt: now - 10 * DAY,
    durationSeconds: 1200,
    rounds: 6,
  },
];
