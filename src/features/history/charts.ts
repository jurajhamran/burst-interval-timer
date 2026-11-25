import { dayKey } from "./stats";
import type { HistoryEntry } from "./types/types";

/** Selectable windows for the volume chart. */
export type VolumeRange = 7 | 14 | 30 | "all";

export type VolumeGranularity = "day" | "week";

export interface VolumePoint {
  key: string;
  /** Short axis tick label. */
  label: string;
  /** Longer label for tooltips and screen readers. */
  fullLabel: string;
  /** Start of the bucket at local midnight, epoch ms. */
  start: number;
  seconds: number;
  sessions: number;
}

export interface VolumeSeries {
  points: VolumePoint[];
  granularity: VolumeGranularity;
  /** Lowercase phrase for prose, e.g. "last 7 days" or "all time". */
  rangeLabel: string;
  /** Capitalized phrase for the card header, e.g. "Last 7 days". */
  rangeTitle: string;
}

export interface WorkoutSlice {
  name: string;
  seconds: number;
  sessions: number;
}

export interface RangeDelta {
  currentSeconds: number;
  previousSeconds: number;
  deltaSeconds: number;
}

/** Ranges longer than this switch from daily to weekly buckets. */
export const WEEKLY_THRESHOLD_DAYS = 90;

const DAY_MS = 86_400_000;

function startOfLocalDay(ts: number): Date {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whole local days between two local midnights. DST-safe. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function rangeLabels(range: VolumeRange): { label: string; title: string } {
  if (range === "all") return { label: "all time", title: "All time" };
  return { label: `last ${range} days`, title: `Last ${range} days` };
}

/**
 * Sessions and time per bucket for the selected range, oldest first.
 * Buckets without sessions are included with zero values so gaps stay visible.
 *
 * Fixed ranges use one bucket per local day. "All time" starts at the earliest
 * recorded session and switches to weekly buckets once the span exceeds
 * `WEEKLY_THRESHOLD_DAYS`, so a long history stays readable.
 */
export function getVolume(
  entries: HistoryEntry[],
  range: VolumeRange,
  now: number = Date.now(),
): VolumeSeries {
  const today = startOfLocalDay(now);
  const { label: rangeLabel, title: rangeTitle } = rangeLabels(range);

  let earliest: Date | null = null;
  for (const entry of entries) {
    const day = startOfLocalDay(entry.completedAt);
    if (!earliest || day.getTime() < earliest.getTime()) earliest = day;
  }

  if (range === "all" && !earliest) {
    return { points: [], granularity: "day", rangeLabel, rangeTitle };
  }

  const spanDays =
    range === "all"
      ? Math.max(1, daysBetween(earliest as Date, today) + 1)
      : range;

  const granularity: VolumeGranularity =
    spanDays > WEEKLY_THRESHOLD_DAYS ? "week" : "day";
  const bucketDays = granularity === "week" ? 7 : 1;
  const bucketCount = Math.ceil(spanDays / bucketDays);

  const tickFormatter = new Intl.DateTimeFormat(
    undefined,
    granularity === "day" && spanDays <= 7
      ? { weekday: "short" }
      : { month: "short", day: "numeric" },
  );
  const fullFormatter = new Intl.DateTimeFormat(
    undefined,
    granularity === "week"
      ? { month: "short", day: "numeric" }
      : { weekday: "short", day: "numeric", month: "short" },
  );

  const points: VolumePoint[] = [];
  for (let index = 0; index < bucketCount; index++) {
    const daysBack = (bucketCount - 1 - index) * bucketDays;
    const start = new Date(today);
    start.setDate(today.getDate() - daysBack - (bucketDays - 1));
    start.setHours(0, 0, 0, 0);

    points.push({
      key: dayKey(start.getTime()),
      label: tickFormatter.format(start),
      fullLabel:
        granularity === "week"
          ? `Week of ${fullFormatter.format(start)}`
          : fullFormatter.format(start),
      start: start.getTime(),
      seconds: 0,
      sessions: 0,
    });
  }

  for (const entry of entries) {
    const offset = daysBetween(startOfLocalDay(entry.completedAt), today);
    if (offset < 0) continue;
    const index = bucketCount - 1 - Math.floor(offset / bucketDays);
    if (index < 0 || index >= bucketCount) continue;
    points[index].seconds += entry.durationSeconds;
    points[index].sessions += 1;
  }

  return { points, granularity, rangeLabel, rangeTitle };
}

/**
 * Total time and session count per workout name, biggest first.
 * Anything past `limit` is folded into a single "Other" slice.
 */
export function getWorkoutBreakdown(
  entries: HistoryEntry[],
  limit = 5,
): WorkoutSlice[] {
  const byName = new Map<string, WorkoutSlice>();

  for (const entry of entries) {
    const name = entry.workoutName.trim();
    const slice = byName.get(name);
    if (slice) {
      slice.seconds += entry.durationSeconds;
      slice.sessions += 1;
    } else {
      byName.set(name, {
        name,
        seconds: entry.durationSeconds,
        sessions: 1,
      });
    }
  }

  const sorted = [...byName.values()].sort(
    (a, b) => b.seconds - a.seconds || b.sessions - a.sessions,
  );

  const max = Math.max(1, limit);
  if (sorted.length <= max) return sorted;

  const head = sorted.slice(0, max - 1);
  const tail = sorted.slice(max - 1);
  head.push({
    name: "Other",
    seconds: tail.reduce((sum, slice) => sum + slice.seconds, 0),
    sessions: tail.reduce((sum, slice) => sum + slice.sessions, 0),
  });

  return head;
}

/**
 * Compares the last `days` days (including today) against the `days` before
 * them, matching the window shown in the volume chart.
 */
export function getRangeDelta(
  entries: HistoryEntry[],
  days: number,
  now: number = Date.now(),
): RangeDelta {
  const span = Math.max(1, Math.floor(days));
  const today = startOfLocalDay(now);
  const currentStart = new Date(today);
  currentStart.setDate(today.getDate() - (span - 1));
  const previousStart = new Date(currentStart);
  previousStart.setDate(currentStart.getDate() - span);

  const currentFrom = currentStart.getTime();
  const previousFrom = previousStart.getTime();

  let currentSeconds = 0;
  let previousSeconds = 0;

  for (const entry of entries) {
    if (entry.completedAt >= currentFrom) {
      currentSeconds += entry.durationSeconds;
    } else if (entry.completedAt >= previousFrom) {
      previousSeconds += entry.durationSeconds;
    }
  }

  return {
    currentSeconds,
    previousSeconds,
    deltaSeconds: currentSeconds - previousSeconds,
  };
}
