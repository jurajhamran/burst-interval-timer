import { describe, it, expect } from "vitest";
import { appendNameSuffix, getCopyName } from "@/features/workouts/copyName";
import { WORKOUT_LIMITS } from "@/features/workouts/config";

describe("getCopyName", () => {
  it("first copy -> Name (copy)", () => {
    expect(getCopyName("Name", [])).toBe("Name (copy)");
  });

  it("with 'Name (copy)' existing -> 'Name (copy 2)'", () => {
    expect(getCopyName("Name", ["Name (copy)"])).toBe("Name (copy 2)");
  });

  it("duplicating 'Name (copy)' -> 'Name (copy 2)'", () => {
    expect(getCopyName("Name (copy)", ["Name (copy)"])).toBe("Name (copy 2)");
  });

  it("gap -> 'Name (copy 2)'", () => {
    expect(getCopyName("Name", ["Name (copy)", "Name (copy 3)"])).toBe(
      "Name (copy 2)",
    );
  });

  it("case-insensitive match", () => {
    expect(getCopyName("Name", ["name (COPY)"])).toBe("Name (copy 2)");
  });

  it("regex special characters work", () => {
    expect(getCopyName("A.B+ (test)", ["A.B+ (test) (copy)"])).toBe(
      "A.B+ (test) (copy 2)",
    );
  });

  it("fallback when all generated candidates are taken", () => {
    const existing = [
      "Name (copy)",
      "Name (copy 2)",
      "Name (copy 3)",
      "Name (copy 4)",
      "Name (copy 5)",
    ];
    expect(getCopyName("Name", existing)).toBe("Name (copy 6)");
  });

  it("keeps copy names within the workout name limit", () => {
    const name = "x".repeat(WORKOUT_LIMITS.name.max);
    const copy = getCopyName(name, []);
    expect(copy.length).toBeLessThanOrEqual(WORKOUT_LIMITS.name.max);
    expect(copy.endsWith(" (copy)")).toBe(true);
  });

  it("keeps truncated copy names unique", () => {
    const name = "x".repeat(WORKOUT_LIMITS.name.max);
    const first = getCopyName(name, []);
    const second = getCopyName(name, [first]);
    expect(second.length).toBeLessThanOrEqual(WORKOUT_LIMITS.name.max);
    expect(second).not.toBe(first);
    expect(second.endsWith(" (copy 2)")).toBe(true);
  });
});

describe("appendNameSuffix", () => {
  it("leaves short names untouched", () => {
    expect(appendNameSuffix("Changed", " (imported)")).toBe(
      "Changed (imported)",
    );
  });

  it("truncates the base so the result fits the limit", () => {
    const name = "x".repeat(WORKOUT_LIMITS.name.max);
    const result = appendNameSuffix(name, " (imported)");
    expect(result.length).toBeLessThanOrEqual(WORKOUT_LIMITS.name.max);
    expect(result.endsWith(" (imported)")).toBe(true);
  });
});
