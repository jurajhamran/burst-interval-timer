import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry } from "./types/types";
import { HistoryEntrySchema } from "./types/types";

export function normalizeEntry(raw: unknown): HistoryEntry | null {
  const result = HistoryEntrySchema.safeParse(raw);
  if (!result.success) return null;
  return result.data;
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