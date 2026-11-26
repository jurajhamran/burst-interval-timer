import { describe, it, expect } from "vitest";
import { WorkoutSchema } from "@/features/workouts/types/types";
import { WORKOUT_LIMITS } from "@/features/workouts/config";

function baseWorkout() {
  return {
    id: "w1",
    name: "Test",
    rounds: 2,
    items: [
      { id: "a", type: "work" as const, label: "Work", duration: 20 },
      { id: "b", type: "rest" as const, label: "Rest", duration: 10 },
    ],
  };
}

function firstMessage(result: ReturnType<typeof WorkoutSchema.safeParse>) {
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("WorkoutSchema limits", () => {
  it("accepts a workout at the name limit", () => {
    const result = WorkoutSchema.safeParse({
      ...baseWorkout(),
      name: "x".repeat(WORKOUT_LIMITS.name.max),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a workout name over the limit", () => {
    const result = WorkoutSchema.safeParse({
      ...baseWorkout(),
      name: "x".repeat(WORKOUT_LIMITS.name.max + 1),
    });
    expect(firstMessage(result)).toBe(
      `Workout name must be ${WORKOUT_LIMITS.name.max} characters or fewer`,
    );
  });

  it("trims the workout name", () => {
    const result = WorkoutSchema.safeParse({
      ...baseWorkout(),
      name: "  Leg Day  ",
    });
    expect(result.success && result.data.name).toBe("Leg Day");
  });

  it("rejects an empty exercise name", () => {
    const workout = baseWorkout();
    const result = WorkoutSchema.safeParse({
      ...workout,
      items: [{ ...workout.items[0], label: "   " }],
    });
    expect(firstMessage(result)).toBe("Give this exercise a name");
  });

  it("accepts an exercise name at the limit and rejects one over it", () => {
    const workout = baseWorkout();
    const atLimit = WorkoutSchema.safeParse({
      ...workout,
      items: [
        {
          ...workout.items[0],
          label: "x".repeat(WORKOUT_LIMITS.exerciseName.max),
        },
      ],
    });
    expect(atLimit.success).toBe(true);

    const overLimit = WorkoutSchema.safeParse({
      ...workout,
      items: [
        {
          ...workout.items[0],
          label: "x".repeat(WORKOUT_LIMITS.exerciseName.max + 1),
        },
      ],
    });
    expect(firstMessage(overLimit)).toBe(
      `Exercise name must be ${WORKOUT_LIMITS.exerciseName.max} characters or fewer`,
    );
  });

  it("trims exercise names", () => {
    const workout = baseWorkout();
    const result = WorkoutSchema.safeParse({
      ...workout,
      items: [{ ...workout.items[0], label: "  Push-ups  " }],
    });
    expect(result.success && result.data.items[0].label).toBe("Push-ups");
  });

  it("forces the rest label to Rest", () => {
    const workout = baseWorkout();
    const result = WorkoutSchema.safeParse({
      ...workout,
      items: [{ ...workout.items[1], label: "Stretch" }],
    });
    expect(result.success && result.data.items[0].label).toBe("Rest");
  });

  it("enforces item, prepare and round rest duration limits", () => {
    const workout = baseWorkout();
    expect(
      WorkoutSchema.safeParse({
        ...workout,
        items: [
          {
            ...workout.items[0],
            duration: WORKOUT_LIMITS.itemDuration.min - 1,
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      WorkoutSchema.safeParse({
        ...workout,
        prepare: {
          enabled: true,
          duration: WORKOUT_LIMITS.prepareDuration.max + 1,
        },
      }).success,
    ).toBe(false);

    expect(
      WorkoutSchema.safeParse({
        ...workout,
        roundRest: {
          enabled: true,
          duration: WORKOUT_LIMITS.roundRestDuration.max + 1,
        },
      }).success,
    ).toBe(false);
  });
});
