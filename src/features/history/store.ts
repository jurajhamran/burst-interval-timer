import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry } from "./types";

export function normalizeEntry(raw: unknown): HistoryEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.id !== "string" || r.id.trim() === "") return null;
  if (typeof r.workoutId !== "string" || r.workoutId.trim() === "") return null;
  if (typeof r.workoutName !== "string" || r.workoutName.trim() === "") return null;
  if (typeof r.completedAt !== "number" || !Number.isFinite(r.completedAt) || r.completedAt <= 0) return null;
  if (typeof r.durationSeconds !== "number" || !Number.isFinite(r.durationSeconds) || r.durationSeconds <= 0) return null;
  if (typeof r.rounds !== "number" || !Number.isInteger(r.rounds) || r.rounds < 1) return null;

  return {
    id: r.id,
    workoutId: r.workoutId,
    workoutName: r.workoutName,
    completedAt: r.completedAt,
    durationSeconds: r.durationSeconds,
    rounds: r.rounds,
  };
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  addEntries: (list: HistoryEntry[]) => void;
  deleteEntry: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => {
          const entries = [entry, ...state.entries];
          if (entries.length > 1000) entries.splice(1000);
          return { entries };
        }),
      addEntries: (list) =>
        set((state) => {
          const merged = [...state.entries, ...list];
          merged.sort((a, b) => b.completedAt - a.completedAt);
          return { entries: merged.slice(0, 1000) };
        }),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      clearHistory: () => set({ entries: [] }),
    }),
    {
      name: "tabata-history",
      version: 1,
    },
  ),
);