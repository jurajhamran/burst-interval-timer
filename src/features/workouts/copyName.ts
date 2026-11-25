import { WORKOUT_LIMITS } from "./config";

/** Appends a suffix without letting the name exceed the workout name limit. */
export function appendNameSuffix(
  name: string,
  suffix: string,
  max = WORKOUT_LIMITS.name.max,
): string {
  const available = Math.max(0, max - suffix.length);
  return `${name.trim().slice(0, available).trimEnd()}${suffix}`;
}

export function getCopyName(
  name: string,
  existingNames: string[],
  max = WORKOUT_LIMITS.name.max,
): string {
  const base = name.replace(/ \(copy(?: \d+)?\)$/, "").trim();

  const candidates: string[] = [appendNameSuffix(base, " (copy)", max)];
  let n = 2;
  while (true) {
    candidates.push(appendNameSuffix(base, ` (copy ${n})`, max));
    n += 1;
    // generate lazily; break handled below
    if (n > existingNames.length + 2) break;
  }

  const normalizedExisting = existingNames.map((n) => n.trim().toLowerCase());

  for (const candidate of candidates) {
    const normalized = candidate.trim().toLowerCase();
    if (!normalizedExisting.includes(normalized)) {
      return candidate;
    }
  }

  // Fallback (should not happen): keep incrementing.
  let i = 2;
  while (true) {
    const candidate = appendNameSuffix(base, ` (copy ${i})`, max);
    if (!normalizedExisting.includes(candidate.trim().toLowerCase())) {
      return candidate;
    }
    i += 1;
  }
}
