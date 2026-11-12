import { describe, it, expect } from "vitest";
import { getCopyName } from "@/features/workouts/copyName";

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
});
