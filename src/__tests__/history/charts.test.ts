import { describe, it, expect } from "vitest";
import {
  getDailyVolume,
  getWeekDelta,
  getWorkoutBreakdown,
} from "@/features/history/charts";
import type { HistoryEntry } from "@/features/history/types/types";

let nextId = 0;

function entry(
  completedAt: number,
  durationSeconds = 10,
  workoutName = "Test",
): HistoryEntry {
  nextId += 1;
  return {
    id: `e-${nextId}`,
    workoutId: "w1",
    workoutName,
    completedAt,
    durationSeconds,
    rounds: 2,
  };
}

const now = new Date(2026, 10, 10, 12).getTime();

describe("getDailyVolume", () => {
  it("returns one zero-filled bucket per day, oldest first", () => {
    const volume = getDailyVolume([], 7, now);

    expect(volume).toHaveLength(7);
    expect(volume.every((day) => day.seconds === 0)).toBe(true);
    expect(volume[6].key).toBe("2026-10-10");
    expect(volume[0].key).toBe("2026-10-4");
  });

  it("sums sessions and seconds into the matching day", () => {
    const volume = getDailyVolume(
      [
        entry(new Date(2026, 10, 10, 8).getTime(), 60),
        entry(new Date(2026, 10, 10, 18).getTime(), 40),
        entry(new Date(2026, 10, 9, 8).getTime(), 30),
      ],
      7,
      now,
    );

    expect(volume[6].seconds).toBe(100);
    expect(volume[6].sessions).toBe(2);
    expect(volume[5].seconds).toBe(30);
    expect(volume[5].sessions).toBe(1);
    expect(volume[4].sessions).toBe(0);
  });

  it("ignores entries outside the window", () => {
    const eightDaysAgo = new Date(2026, 10, 3, 12).getTime();
    const volume = getDailyVolume([entry(eightDaysAgo, 500)], 7, now);

    expect(volume.reduce((sum, day) => sum + day.seconds, 0)).toBe(0);
  });

  it("supports a 30 day window", () => {
    const volume = getDailyVolume([entry(now, 60)], 30, now);

    expect(volume).toHaveLength(30);
    expect(volume[29].seconds).toBe(60);
  });

  it("exposes short and full labels", () => {
    const [day] = getDailyVolume([], 30, now);

    expect(day.label).toContain("12");
    expect(day.fullLabel).toContain("Oct");
    expect(day.fullLabel).toContain("12");
  });
});

describe("getWorkoutBreakdown", () => {
  it("orders buckets by total time, biggest first", () => {
    const slices = getWorkoutBreakdown([
      entry(now, 30, "Short"),
      entry(now, 300, "Long"),
      entry(now, 100, "Medium"),
    ]);

    expect(slices.map((slice) => slice.name)).toEqual([
      "Long",
      "Medium",
      "Short",
    ]);
    expect(slices[0].seconds).toBe(300);
    expect(slices[0].sessions).toBe(1);
  });

  it("folds the remainder into Other once past the limit", () => {
    const names = ["A", "B", "C", "D", "E", "F", "G"];
    const slices = getWorkoutBreakdown(
      names.map((name, index) => entry(now, 700 - index * 100, name)),
      5,
    );

    expect(slices).toHaveLength(5);
    expect(slices.slice(0, 4).map((slice) => slice.name)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(slices[4]).toMatchObject({ name: "Other", seconds: 600, sessions: 3 });
  });

  it("omits Other when everything fits", () => {
    const slices = getWorkoutBreakdown([
      entry(now, 60, "A"),
      entry(now, 30, "B"),
    ]);

    expect(slices.map((slice) => slice.name)).toEqual(["A", "B"]);
  });

  it("breaks ties by session count", () => {
    const slices = getWorkoutBreakdown([
      entry(now, 100, "Rare"),
      entry(now, 50, "Often"),
      entry(now, 50, "Often"),
    ]);

    expect(slices.map((slice) => slice.name)).toEqual(["Often", "Rare"]);
  });

  it("merges entries that share a workout name", () => {
    const slices = getWorkoutBreakdown([
      entry(now, 60, "Core"),
      entry(now, 40, "Core"),
    ]);

    expect(slices).toEqual([{ name: "Core", seconds: 100, sessions: 2 }]);
  });
});

describe("getWeekDelta", () => {
  it("splits the last 14 days into two weeks", () => {
    const week = getWeekDelta(
      [
        entry(new Date(2026, 10, 10, 8).getTime(), 60),
        entry(new Date(2026, 10, 4, 0, 0, 0, 0).getTime(), 40),
        entry(new Date(2026, 10, 3, 23, 59).getTime(), 30),
      ],
      now,
    );

    expect(week.thisWeekSeconds).toBe(100);
    expect(week.lastWeekSeconds).toBe(30);
    expect(week.deltaSeconds).toBe(70);
  });

  it("counts an entry on the boundary as last week", () => {
    const week = getWeekDelta(
      [entry(new Date(2026, 9, 28, 0, 0, 0, 0).getTime(), 25)],
      now,
    );

    expect(week.lastWeekSeconds).toBe(25);
    expect(week.thisWeekSeconds).toBe(0);
  });

  it("ignores anything older than two weeks", () => {
    const week = getWeekDelta(
      [entry(new Date(2026, 9, 27, 23, 59).getTime(), 99)],
      now,
    );

    expect(week.thisWeekSeconds).toBe(0);
    expect(week.lastWeekSeconds).toBe(0);
    expect(week.deltaSeconds).toBe(0);
  });
});
