import { describe, it, expect } from "vitest";
import {
  getRangeDelta,
  getVolume,
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

describe("getVolume", () => {
  it("returns one zero-filled bucket per day, oldest first", () => {
    const { points, granularity } = getVolume([], 7, now);

    expect(granularity).toBe("day");
    expect(points).toHaveLength(7);
    expect(points.every((day) => day.seconds === 0)).toBe(true);
    expect(points[6].key).toBe("2026-10-10");
    expect(points[0].key).toBe("2026-10-4");
  });

  it("sums sessions and seconds into the matching day", () => {
    const { points } = getVolume(
      [
        entry(new Date(2026, 10, 10, 8).getTime(), 60),
        entry(new Date(2026, 10, 10, 18).getTime(), 40),
        entry(new Date(2026, 10, 9, 8).getTime(), 30),
      ],
      7,
      now,
    );

    expect(points[6].seconds).toBe(100);
    expect(points[6].sessions).toBe(2);
    expect(points[5].seconds).toBe(30);
    expect(points[5].sessions).toBe(1);
    expect(points[4].sessions).toBe(0);
  });

  it("ignores entries outside the window", () => {
    const eightDaysAgo = new Date(2026, 10, 3, 12).getTime();
    const { points } = getVolume([entry(eightDaysAgo, 500)], 7, now);

    expect(points.reduce((sum, day) => sum + day.seconds, 0)).toBe(0);
  });

  it("supports 14 and 30 day windows", () => {
    const twoWeeks = getVolume([entry(now, 60)], 14, now);
    const month = getVolume([entry(now, 60)], 30, now);

    expect(twoWeeks.points).toHaveLength(14);
    expect(twoWeeks.points[13].seconds).toBe(60);
    expect(month.points).toHaveLength(30);
    expect(month.points[29].seconds).toBe(60);
  });

  it("exposes short and full labels", () => {
    const [day] = getVolume([], 30, now).points;

    expect(day.label).toContain("12");
    expect(day.fullLabel).toContain("Oct");
    expect(day.fullLabel).toContain("12");
  });

  it("uses weekday ticks for a one week window", () => {
    const { points } = getVolume([], 7, now);

    expect(points[6].label).toBe(
      new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
        new Date(2026, 10, 10),
      ),
    );
  });

  it("starts an all-time series at the earliest session", () => {
    const { points, granularity, rangeLabel } = getVolume(
      [entry(new Date(2026, 10, 7, 9).getTime(), 30), entry(now, 60)],
      "all",
      now,
    );

    expect(granularity).toBe("day");
    expect(rangeLabel).toBe("all time");
    expect(points).toHaveLength(4);
    expect(points[0].key).toBe("2026-10-7");
    expect(points[0].seconds).toBe(30);
    expect(points[3].seconds).toBe(60);
  });

  it("switches to weekly buckets for long all-time histories", () => {
    const hundredDaysAgo = new Date(2026, 7, 2, 9).getTime();
    const { points, granularity } = getVolume(
      [entry(hundredDaysAgo, 40), entry(now, 60)],
      "all",
      now,
    );

    expect(granularity).toBe("week");
    expect(points.length).toBeLessThan(20);
    expect(points.reduce((sum, point) => sum + point.seconds, 0)).toBe(100);
    expect(points[0].seconds).toBe(40);
    expect(points[points.length - 1].seconds).toBe(60);
    expect(points[0].fullLabel.startsWith("Week of ")).toBe(true);
  });

  it("returns an empty series for all time with no sessions", () => {
    const series = getVolume([], "all", now);

    expect(series.points).toEqual([]);
    expect(series.rangeLabel).toBe("all time");
    expect(series.rangeTitle).toBe("All time");
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

describe("getRangeDelta", () => {
  it("splits the last 14 days into two weeks", () => {
    const delta = getRangeDelta(
      [
        entry(new Date(2026, 10, 10, 8).getTime(), 60),
        entry(new Date(2026, 10, 4, 0, 0, 0, 0).getTime(), 40),
        entry(new Date(2026, 10, 3, 23, 59).getTime(), 30),
      ],
      7,
      now,
    );

    expect(delta.currentSeconds).toBe(100);
    expect(delta.previousSeconds).toBe(30);
    expect(delta.deltaSeconds).toBe(70);
  });

  it("counts an entry on the boundary as previous period", () => {
    const delta = getRangeDelta(
      [entry(new Date(2026, 9, 28, 0, 0, 0, 0).getTime(), 25)],
      7,
      now,
    );

    expect(delta.previousSeconds).toBe(25);
    expect(delta.currentSeconds).toBe(0);
  });

  it("ignores anything older than the two periods", () => {
    const delta = getRangeDelta(
      [entry(new Date(2026, 9, 27, 23, 59).getTime(), 99)],
      7,
      now,
    );

    expect(delta.currentSeconds).toBe(0);
    expect(delta.previousSeconds).toBe(0);
    expect(delta.deltaSeconds).toBe(0);
  });

  it("uses equal length windows for a 30 day range", () => {
    const delta = getRangeDelta(
      [
        entry(new Date(2026, 10, 9, 9).getTime(), 50),
        entry(new Date(2026, 8, 20, 9).getTime(), 20),
        entry(new Date(2026, 7, 1, 9).getTime(), 999),
      ],
      30,
      now,
    );

    expect(delta.currentSeconds).toBe(50);
    expect(delta.previousSeconds).toBe(20);
    expect(delta.deltaSeconds).toBe(30);
  });
});
