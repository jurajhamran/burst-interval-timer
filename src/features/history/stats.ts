import type { HistoryEntry } from "./types";

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function getStats(
  entries: HistoryEntry[],
  now: number = Date.now(),
): { sessions: number; totalSeconds: number; streak: number } {
  const sessions = entries.length;
  const totalSeconds = entries.reduce((sum, e) => sum + e.durationSeconds, 0);

  const days = new Set(entries.map((e) => dayKey(e.completedAt)));

  const todayKey = dayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = dayKey(yesterdayDate.getTime());

  let cursor: Date;
  if (days.has(todayKey)) {
    cursor = new Date(now);
  } else if (days.has(yesterdayKey)) {
    cursor = yesterdayDate;
  } else {
    return { sessions, totalSeconds, streak: 0 };
  }

  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { sessions, totalSeconds, streak };
}

export function groupByDay(
  entries: HistoryEntry[],
  now: number = Date.now(),
): { key: string; label: string; entries: HistoryEntry[] }[] {
  const todayKey = dayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = dayKey(yesterdayDate.getTime());

  const map = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const key = dayKey(entry.completedAt);
    const list = map.get(key);
    if (list) {
      list.push(entry);
    } else {
      map.set(key, [entry]);
    }
  }

  const groups: { key: string; label: string; entries: HistoryEntry[] }[] = [];
  for (const [key, list] of map) {
    let label: string;
    if (key === todayKey) {
      label = "Today";
    } else if (key === yesterdayKey) {
      label = "Yesterday";
    } else {
      label = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(list[0].completedAt));
    }
    groups.push({ key, label, entries: list });
  }

  return groups;
}