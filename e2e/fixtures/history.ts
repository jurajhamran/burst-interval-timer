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
