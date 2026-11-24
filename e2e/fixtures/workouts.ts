import type { Workout } from "../../src/features/workouts/types/types";

export const fastWorkout: Workout = {
  id: "e2e-fast",
  name: "Fast Test",
  rounds: 1,
  items: [
    {
      id: "fast-work",
      type: "work",
      label: "Sprint",
      duration: 1,
    },
  ],
  prepare: { enabled: false, duration: 5 },
  roundRest: { enabled: false, duration: 30 },
  skipLastRest: true,
};
