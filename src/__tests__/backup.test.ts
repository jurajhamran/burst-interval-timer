import { describe, it, expect } from "vitest";
import {
  buildBackup,
  parseBackup,
  planImport,
  backupFileName,
  BACKUP_VERSION,
} from "@/features/backup/backup";
import { makeWorkout } from "@/test/factories";
import type { HistoryEntry } from "@/features/history/types";

function entry(id: string, completedAt = 1000): HistoryEntry {
  return {
    id,
    workoutId: "w1",
    workoutName: "Test",
    completedAt,
    durationSeconds: 10,
    rounds: 2,
  };
}

describe("backup", () => {
  it("round trips build -> parse", () => {
    const workouts = [makeWorkout()];
    const history = [entry("h1")];
    const backup = buildBackup(workouts, history, new Date("2026-01-02T03:04:05Z"));
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.workouts).toHaveLength(1);
      expect(parsed.history).toHaveLength(1);
      expect(parsed.skipped).toBe(0);
    }
  });

  it("invalid JSON", () => {
    const parsed = parseBackup("{not json");
    expect(parsed.ok).toBe(false);
  });

  it("non-object parsed JSON returns error", () => {
    const parsed = parseBackup("123");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("Invalid backup file");
  });

  it("wrong app", () => {
    const parsed = parseBackup(JSON.stringify({ app: "other", version: 1, workouts: [], history: [] }));
    expect(parsed.ok).toBe(false);
  });

  it("missing version returns error", () => {
    const parsed = parseBackup(JSON.stringify({ app: "tabata-timer", version: "1", workouts: [], history: [] }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("Missing version");
  });

  it("missing workouts or history arrays returns error", () => {
    const parsed = parseBackup(JSON.stringify({ app: "tabata-timer", version: 1, workouts: "not-array", history: [] }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("Missing workouts or history arrays");
  });

  it("newer version rejected", () => {
    const parsed = parseBackup(
      JSON.stringify({ app: "tabata-timer", version: BACKUP_VERSION + 1, workouts: [], history: [] }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("newer version");
  });

  it("invalid workouts dropped and counted", () => {
    const parsed = parseBackup(
      JSON.stringify({
        app: "tabata-timer",
        version: 1,
        workouts: [makeWorkout(), { bad: true }],
        history: [],
      }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.workouts).toHaveLength(1);
      expect(parsed.skipped).toBe(1);
    }
  });

  it("invalid history entry dropped and counted", () => {
    const parsed = parseBackup(
      JSON.stringify({
        app: "tabata-timer",
        version: 1,
        workouts: [],
        history: [entry("h1"), { bad: true }],
      }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.history).toHaveLength(1);
      expect(parsed.skipped).toBe(1);
    }
  });

  it("old-format workout missing fields gets defaults", () => {
    const old = {
      id: "old",
      name: "Old",
      rounds: 3,
      items: [{ id: "a", type: "work", label: "Work", duration: 20 }],
    };
    const parsed = parseBackup(
      JSON.stringify({ app: "tabata-timer", version: 1, workouts: [old], history: [] }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.workouts[0].prepare).toBeDefined();
      expect(parsed.workouts[0].roundRest).toBeDefined();
      expect(typeof parsed.workouts[0].skipLastRest).toBe("boolean");
    }
  });

  it("planImport skips identical, copies conflicting, adds new, dedupes history", () => {
    const w1 = makeWorkout({ id: "w1" });
    const w1conflict = makeWorkout({ id: "w1", name: "Changed" });
    const w2 = makeWorkout({ id: "w2", name: "Second" });

    const existing = { workouts: [w1], history: [entry("h1")] };
    const incoming = { workouts: [w1, w1conflict, w2], history: [entry("h1"), entry("h2")] };

    const plan = planImport(existing, incoming);
    expect(plan.workoutsToAdd).toHaveLength(2); // conflict copy + new
    expect(plan.workoutsToAdd.some((w) => w.name === "Changed (imported)")).toBe(true);
    expect(plan.entriesToAdd).toHaveLength(1);
    expect(plan.entriesToAdd[0].id).toBe("h2");
  });

  it("backupFileName format", () => {
    const name = backupFileName(new Date(2026, 0, 5));
    expect(name).toBe("tabata-backup-2026-01-05.json");
  });
});
