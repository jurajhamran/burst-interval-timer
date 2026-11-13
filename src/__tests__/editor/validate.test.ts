import { describe, it, expect } from "vitest";
import { validateDraft } from "@/features/editor/validate";
import { makeWorkout } from "../factories";

describe("validateDraft", () => {
  it("empty name", () => {
    const draft = makeWorkout({ name: "" });
    expect(validateDraft(draft).name).toBe("Give your workout a name");
  });

  it("whitespace-only name", () => {
    const draft = makeWorkout({ name: "   " });
    expect(validateDraft(draft).name).toBe("Give your workout a name");
  });

  it("no items", () => {
    const draft = makeWorkout({ items: [] });
    expect(validateDraft(draft).items).toBe("Add at least one work or rest item");
  });

  it("both errors", () => {
    const draft = makeWorkout({ name: "", items: [] });
    const errors = validateDraft(draft);
    expect(errors.name).toBe("Give your workout a name");
    expect(errors.items).toBe("Add at least one work or rest item");
  });

  it("valid draft", () => {
    const draft = makeWorkout();
    expect(validateDraft(draft)).toEqual({});
  });
});
