import type { Workout } from "@/features/workouts/types";
import type { HistoryEntry } from "@/features/history/types";
import { normalizeWorkout } from "@/features/workouts/store";
import { normalizeEntry } from "@/features/history/store";

export const BACKUP_VERSION = 1;

export interface BackupData {
  app: "tabata-timer";
  version: number;
  exportedAt: string;
  workouts: Workout[];
  history: HistoryEntry[];
}

export function buildBackup(
  workouts: Workout[],
  history: HistoryEntry[],
  now: Date = new Date(),
): BackupData {
  return {
    app: "tabata-timer",
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    workouts,
    history,
  };
}

export function parseBackup(
  text: string,
): { ok: true; workouts: Workout[]; history: HistoryEntry[]; skipped: number } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Invalid backup file" };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.app !== "tabata-timer") {
    return { ok: false, error: "Not a tabata-timer backup" };
  }

  if (typeof obj.version !== "number") {
    return { ok: false, error: "Missing version" };
  }

  if (obj.version > BACKUP_VERSION) {
    return { ok: false, error: "This backup was made by a newer version of the app" };
  }

  if (!Array.isArray(obj.workouts) || !Array.isArray(obj.history)) {
    return { ok: false, error: "Missing workouts or history arrays" };
  }

  let skipped = 0;
  const workouts: Workout[] = [];
  for (const raw of obj.workouts) {
    const w = normalizeWorkout(raw);
    if (w) workouts.push(w);
    else skipped += 1;
  }

  const history: HistoryEntry[] = [];
  for (const raw of obj.history) {
    const e = normalizeEntry(raw);
    if (e) history.push(e);
    else skipped += 1;
  }

  return { ok: true, workouts, history, skipped };
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function planImport(
  existing: { workouts: Workout[]; history: HistoryEntry[] },
  incoming: { workouts: Workout[]; history: HistoryEntry[] },
): {
  workoutsToAdd: Workout[];
  entriesToAdd: HistoryEntry[];
  duplicates: number;
  renamedCopies: number;
} {
  const workoutsToAdd: Workout[] = [];
  let duplicates = 0;
  let renamedCopies = 0;

  for (const inc of incoming.workouts) {
    const match = existing.workouts.find((w) => w.id === inc.id);
    if (!match) {
      workoutsToAdd.push(inc);
    } else if (deepEqual(match, inc)) {
      duplicates += 1;
    } else {
      workoutsToAdd.push({
        ...inc,
        id: crypto.randomUUID(),
        name: `${inc.name} (imported)`,
      });
      renamedCopies += 1;
    }
  }

  const existingHistoryIds = new Set(existing.history.map((e) => e.id));
  const entriesToAdd: HistoryEntry[] = [];
  for (const inc of incoming.history) {
    if (existingHistoryIds.has(inc.id)) {
      duplicates += 1;
    } else {
      entriesToAdd.push(inc);
    }
  }

  return { workoutsToAdd, entriesToAdd, duplicates, renamedCopies };
}

export function backupFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `tabata-backup-${y}-${m}-${d}.json`;
}