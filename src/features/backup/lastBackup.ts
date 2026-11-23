export const BACKUP_REMINDER_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isBackupStale(
  lastBackupAt: number | null,
  now: number = Date.now(),
): boolean {
  if (lastBackupAt === null) return true;
  return now - lastBackupAt > BACKUP_REMINDER_DAYS * DAY_MS;
}

export function formatLastBackup(
  lastBackupAt: number | null,
  now: number = Date.now(),
): string {
  if (lastBackupAt === null) return "Never";

  const startOfDay = (ts: number) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const daysAgo = Math.round(
    (startOfDay(now) - startOfDay(lastBackupAt)) / DAY_MS,
  );

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo > 1 && daysAgo < 7) return `${daysAgo} days ago`;

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(lastBackupAt));
}
