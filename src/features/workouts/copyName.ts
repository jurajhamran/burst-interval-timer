export function getCopyName(name: string, existingNames: string[]): string {
  const base = name.replace(/ \(copy(?: \d+)?\)$/, "");

  const candidates: string[] = [`${base} (copy)`];
  let n = 2;
  while (true) {
    candidates.push(`${base} (copy ${n})`);
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
    const candidate = `${base} (copy ${i})`;
    if (!normalizedExisting.includes(candidate.trim().toLowerCase())) {
      return candidate;
    }
    i += 1;
  }
}