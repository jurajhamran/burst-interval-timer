import { dayKey } from "./stats";
import type { HistoryEntry } from "./types/types";

export interface DailyVolume {
  key: string;
  /** Short axis tick label. */
  label: string;
  /** Longer label for tooltips and screen readers. */
  fullLabel: string;
  dayStart: number;
  seconds: number;
  sessions: number;
}

export interface WorkoutSlice {
  name: string;
  seconds: number;
  sessions: number;
}

export interface WeekDelta {
  thisWeekSeconds: number;
  lastWeekSeconds: number;
  deltaSeconds: number;
}

function startOfLocalDay(ts: number): Date {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Sessions and time per local day for the last `days` days, oldest first.
 * Days without sessions are included with zero values so gaps stay visible.
 */
export function getDailyVolume(
  entries: HistoryEntry[],
  days: number,
  now: number = Date.now(),
): DailyVolume[] {
  const span = Math.max(1, Math.floor(days));
  const today = startOfLocalDay(now);

  const tickFormatter = new Intl.DateTimeFormat(
    undefined,
    span <= 7
      ? { weekday: "short" }
      : { month: "short", day: "numeric" },
  );
  const fullFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const buckets: DailyVolume[] = [];
  const byKey = new Map<string, DailyVolume>();

  for (let offset = span - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    date.setHours(0, 0, 0, 0);

    const bucket: DailyVolume = {
      key: dayKey(date.getTime()),
      label: tickFormatter.format(date),
      fullLabel: fullFormatter.format(date),
      dayStart: date.getTime(),
      seconds: 0,
      sessions: 0,
    };

    buckets.push(bucket);
    byKey.set(bucket.key, bucket);
  }

  for (const entry of entries) {
    const bucket = byKey.get(dayKey(entry.completedAt));
    if (!bucket) continue;
    bucket.seconds += entry.durationSeconds;
    bucket.sessions += 1;
  }

  return buckets;
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
 * Rolling 7-day comparison: today and the six days before it, against the
 * seven days before that.
 */
export function getWeekDelta(
  entries: HistoryEntry[],
  now: number = Date.now(),
): WeekDelta {
  const today = startOfLocalDay(now);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 6);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const thisStart = thisWeekStart.getTime();
  const lastStart = lastWeekStart.getTime();

  let thisWeekSeconds = 0;
  let lastWeekSeconds = 0;

  for (const entry of entries) {
    if (entry.completedAt >= thisStart) {
      thisWeekSeconds += entry.durationSeconds;
    } else if (entry.completedAt >= lastStart) {
      lastWeekSeconds += entry.durationSeconds;
    }
  }

  return {
    thisWeekSeconds,
    lastWeekSeconds,
    deltaSeconds: thisWeekSeconds - lastWeekSeconds,
  };
}
