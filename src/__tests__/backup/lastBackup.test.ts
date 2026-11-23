import { describe, expect, it } from "vitest";
import {
  BACKUP_REMINDER_DAYS,
  formatLastBackup,
  isBackupStale,
} from "@/features/backup/lastBackup";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("lastBackup", () => {
  const now = new Date(2026, 2, 15, 12, 0, 0).getTime();

  it("treats never backing up as stale", () => {
    expect(isBackupStale(null, now)).toBe(true);
    expect(formatLastBackup(null, now)).toBe("Never");
  });

  it("does not flag a recent backup as stale", () => {
    expect(isBackupStale(now - DAY_MS, now)).toBe(false);
  });

  it("flags a backup older than the reminder window", () => {
    expect(
      isBackupStale(now - (BACKUP_REMINDER_DAYS + 1) * DAY_MS, now),
    ).toBe(true);
  });

  it("formats recent backups by day", () => {
    expect(formatLastBackup(now, now)).toBe("Today");
    expect(formatLastBackup(now - DAY_MS, now)).toBe("Yesterday");
    expect(formatLastBackup(now - 3 * DAY_MS, now)).toBe("3 days ago");
  });

  it("formats older backups as a date", () => {
    const label = formatLastBackup(now - 30 * DAY_MS, now);
    expect(label).not.toBe("Today");
    expect(label).toContain("2026");
  });
});
