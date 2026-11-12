import type { Workout } from "@/features/workouts/types";

export function validateDraft(draft: Workout): { name?: string; items?: string } {
  const errors: { name?: string; items?: string } = {};
  if (draft.name.trim() === "") {
    errors.name = "Give your workout a name";
  }
  if (draft.items.length === 0) {
    errors.items = "Add at least one work or rest item";
  }
  return errors;
}