import { describe, it, expect } from "vitest";
import { getStats, groupByDay } from "@/features/history/stats";
import type { HistoryEntry } from "@/features/history/types";

function entry(completedAt: number, durationSeconds = 10): HistoryEntry {
  return {
    id: `e-${completedAt}`,
    workoutId: "w1",
    workoutName: "Test",
    completedAt,
    durationSeconds,
    rounds: 2,
  };
}

const today = new Date(2026, 10, 10, 12).getTime();
const yesterday = new Date(2026, 10, 9, 12).getTime();
const twoDaysAgo = new Date(2026, 10, 8, 12).getTime();

describe("getStats", () => {
  it("empty -> 0 streak", () => {
    const stats = getStats([]);
    expect(stats.streak).toBe(0);
    expect(stats.sessions).toBe(0);
    expect(stats.totalSeconds).toBe(0);
  });

  it("today + yesterday + 2 days ago -> 3", () => {
    const entries = [entry(today), entry(yesterday), entry(twoDaysAgo)];
    expect(getStats(entries, today).streak).toBe(3);
  });

  it("gap breaks streak", () => {
    const entries = [entry(today), entry(twoDaysAgo)];
    expect(getStats(entries, today).streak).toBe(1);
  });

  it("only yesterday -> 1", () => {
    const entries = [entry(yesterday)];
    expect(getStats(entries, today).streak).toBe(1);
  });

  it("only 2 days ago -> 0", () => {
    const entries = [entry(twoDaysAgo)];
    expect(getStats(entries, today).streak).toBe(0);
  });

  it("multiple entries one day count once", () => {
    const entries = [entry(today), entry(new Date(2026, 10, 10, 8).getTime())];
    expect(getStats(entries, today).streak).toBe(1);
  });

  it("totals sum correctly", () => {
    const entries = [entry(today, 20), entry(yesterday, 30)];
    const stats = getStats(entries, today);
    expect(stats.sessions).toBe(2);
    expect(stats.totalSeconds).toBe(50);
  });
});

describe("groupByDay", () => {
  it("labels Today/Yesterday and orders newest first", () => {
    const sorted = [entry(today, 20), entry(yesterday, 10)];
    const groups = groupByDay(sorted, today);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday"]);
    expect(groups[0].entries[0].durationSeconds).toBe(20);
  });
});
