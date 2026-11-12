import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore, normalizeEntry } from "@/features/history/store";
import type { HistoryEntry } from "@/features/history/types";

describe("normalizeEntry", () => {
  const validEntry: HistoryEntry = {
    id: "e1",
    workoutId: "w1",
    workoutName: "Tabata",
    completedAt: 1000,
    durationSeconds: 240,
    rounds: 8,
  };

  it("returns valid entry as-is", () => {
    expect(normalizeEntry(validEntry)).toEqual(validEntry);
  });

  it("returns null for non-object or null", () => {
    expect(normalizeEntry(null)).toBeNull();
    expect(normalizeEntry(undefined)).toBeNull();
    expect(normalizeEntry("not an object")).toBeNull();
    expect(normalizeEntry(123)).toBeNull();
  });

  it("validates id", () => {
    expect(normalizeEntry({ ...validEntry, id: 123 })).toBeNull();
    expect(normalizeEntry({ ...validEntry, id: "" })).toBeNull();
    expect(normalizeEntry({ ...validEntry, id: "   " })).toBeNull();
  });

  it("validates workoutId", () => {
    expect(normalizeEntry({ ...validEntry, workoutId: 123 })).toBeNull();
    expect(normalizeEntry({ ...validEntry, workoutId: "" })).toBeNull();
    expect(normalizeEntry({ ...validEntry, workoutId: "   " })).toBeNull();
  });

  it("validates workoutName", () => {
    expect(normalizeEntry({ ...validEntry, workoutName: 123 })).toBeNull();
    expect(normalizeEntry({ ...validEntry, workoutName: "" })).toBeNull();
    expect(normalizeEntry({ ...validEntry, workoutName: "   " })).toBeNull();
  });

  it("validates completedAt", () => {
    expect(normalizeEntry({ ...validEntry, completedAt: "1000" })).toBeNull();
    expect(normalizeEntry({ ...validEntry, completedAt: NaN })).toBeNull();
    expect(normalizeEntry({ ...validEntry, completedAt: Infinity })).toBeNull();
    expect(normalizeEntry({ ...validEntry, completedAt: 0 })).toBeNull();
    expect(normalizeEntry({ ...validEntry, completedAt: -10 })).toBeNull();
  });

  it("validates durationSeconds", () => {
    expect(normalizeEntry({ ...validEntry, durationSeconds: "240" })).toBeNull();
    expect(normalizeEntry({ ...validEntry, durationSeconds: NaN })).toBeNull();
    expect(normalizeEntry({ ...validEntry, durationSeconds: Infinity })).toBeNull();
    expect(normalizeEntry({ ...validEntry, durationSeconds: 0 })).toBeNull();
    expect(normalizeEntry({ ...validEntry, durationSeconds: -5 })).toBeNull();
  });

  it("validates rounds", () => {
    expect(normalizeEntry({ ...validEntry, rounds: "8" })).toBeNull();
    expect(normalizeEntry({ ...validEntry, rounds: 8.5 })).toBeNull();
    expect(normalizeEntry({ ...validEntry, rounds: 0 })).toBeNull();
    expect(normalizeEntry({ ...validEntry, rounds: -1 })).toBeNull();
  });
});

describe("useHistoryStore", () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: [] });
  });

  it("starts with empty entries", () => {
    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it("adds a single entry at the beginning", () => {
    const entry1: HistoryEntry = { id: "1", workoutId: "w1", workoutName: "W1", completedAt: 100, durationSeconds: 10, rounds: 2 };
    const entry2: HistoryEntry = { id: "2", workoutId: "w1", workoutName: "W1", completedAt: 200, durationSeconds: 10, rounds: 2 };

    useHistoryStore.getState().addEntry(entry1);
    useHistoryStore.getState().addEntry(entry2);

    expect(useHistoryStore.getState().entries).toEqual([entry2, entry1]);
  });

  it("caps entries at 1000 on addEntry", () => {
    const store = useHistoryStore.getState();
    store.entries = Array.from({ length: 1000 }, (_, i) => ({
      id: `e-${i}`,
      workoutId: "w1",
      workoutName: "W1",
      completedAt: i,
      durationSeconds: 10,
      rounds: 2,
    }));
    const newEntry: HistoryEntry = { id: "new", workoutId: "w1", workoutName: "W1", completedAt: 2000, durationSeconds: 10, rounds: 2 };
    store.addEntry(newEntry);
    expect(useHistoryStore.getState().entries).toHaveLength(1000);
    expect(useHistoryStore.getState().entries[0].id).toBe("new");
  });

  it("caps entries at 1000 on addEntries", () => {
    const store = useHistoryStore.getState();
    const many = Array.from({ length: 1005 }, (_, i) => ({
      id: `e-${i}`,
      workoutId: "w1",
      workoutName: "W1",
      completedAt: i,
      durationSeconds: 10,
      rounds: 2,
    }));
    store.addEntries(many);
    expect(useHistoryStore.getState().entries).toHaveLength(1000);
  });

  it("adds multiple entries, sorts by completedAt descending", () => {
    const entry1: HistoryEntry = { id: "1", workoutId: "w1", workoutName: "W1", completedAt: 100, durationSeconds: 10, rounds: 2 };
    const entry2: HistoryEntry = { id: "2", workoutId: "w1", workoutName: "W1", completedAt: 300, durationSeconds: 10, rounds: 2 };
    const entry3: HistoryEntry = { id: "3", workoutId: "w1", workoutName: "W1", completedAt: 200, durationSeconds: 10, rounds: 2 };

    useHistoryStore.getState().addEntry(entry1);
    useHistoryStore.getState().addEntries([entry2, entry3]);

    const entries = useHistoryStore.getState().entries;
    expect(entries.map((e) => e.id)).toEqual(["2", "3", "1"]);
  });

  it("deletes an entry by id", () => {
    const entry1: HistoryEntry = { id: "1", workoutId: "w1", workoutName: "W1", completedAt: 100, durationSeconds: 10, rounds: 2 };
    const entry2: HistoryEntry = { id: "2", workoutId: "w1", workoutName: "W1", completedAt: 200, durationSeconds: 10, rounds: 2 };

    useHistoryStore.getState().addEntries([entry1, entry2]);
    useHistoryStore.getState().deleteEntry("1");

    expect(useHistoryStore.getState().entries).toEqual([entry2]);
  });

  it("clears history", () => {
    const entry1: HistoryEntry = { id: "1", workoutId: "w1", workoutName: "W1", completedAt: 100, durationSeconds: 10, rounds: 2 };
    useHistoryStore.getState().addEntry(entry1);
    useHistoryStore.getState().clearHistory();
    expect(useHistoryStore.getState().entries).toEqual([]);
  });
});
