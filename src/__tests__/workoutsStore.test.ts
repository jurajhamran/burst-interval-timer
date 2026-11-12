import { describe, it, expect, beforeEach } from "vitest";
import { useWorkoutsStore, normalizeWorkout } from "@/features/workouts/store";
import type { Workout } from "@/features/workouts/types";

describe("normalizeWorkout", () => {
  const validWorkout: Workout = {
    id: "w1",
    name: "Test Workout",
    rounds: 8,
    items: [
      { id: "i1", type: "work", label: "Work", duration: 20 },
      { id: "i2", type: "rest", label: "Rest", duration: 10 },
    ],
    prepare: { enabled: true, duration: 10 },
    roundRest: { enabled: false, duration: 30 },
    skipLastRest: true,
  };

  it("returns valid workout normalized", () => {
    const result = normalizeWorkout(validWorkout);
    expect(result).toEqual(validWorkout);
  });

  it("returns null for non-object or null", () => {
    expect(normalizeWorkout(null)).toBeNull();
    expect(normalizeWorkout(undefined)).toBeNull();
    expect(normalizeWorkout("string")).toBeNull();
  });

  it("validates id", () => {
    expect(normalizeWorkout({ ...validWorkout, id: 123 })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, id: "" })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, id: "   " })).toBeNull();
  });

  it("validates name", () => {
    expect(normalizeWorkout({ ...validWorkout, name: 123 })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, name: "" })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, name: "   " })).toBeNull();
  });

  it("validates rounds", () => {
    expect(normalizeWorkout({ ...validWorkout, rounds: 0 })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, rounds: 100 })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, rounds: 8.5 })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, rounds: "8" })).toBeNull();
  });

  it("validates items", () => {
    expect(normalizeWorkout({ ...validWorkout, items: "not array" })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [] })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [null] })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [{ ...validWorkout.items[0], id: 1 }] })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [{ ...validWorkout.items[0], type: "invalid" }] })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [{ ...validWorkout.items[0], label: 123 }] })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [{ ...validWorkout.items[0], duration: 0 }] })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [{ ...validWorkout.items[0], duration: 4000 }] })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, items: [{ ...validWorkout.items[0], duration: 20.5 }] })).toBeNull();
  });

  it("validates prepare config", () => {
    expect(normalizeWorkout({ ...validWorkout, prepare: "invalid" })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, prepare: { enabled: "yes", duration: 10 } })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, prepare: { enabled: true, duration: "10" } })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, prepare: { enabled: true, duration: 0 } })).toBeNull();
  });

  it("validates roundRest config", () => {
    expect(normalizeWorkout({ ...validWorkout, roundRest: "invalid" })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, roundRest: { enabled: "yes", duration: 30 } })).toBeNull();
    expect(normalizeWorkout({ ...validWorkout, roundRest: { enabled: false, duration: 5000 } })).toBeNull();
  });

  it("validates skipLastRest", () => {
    expect(normalizeWorkout({ ...validWorkout, skipLastRest: "true" })).toBeNull();
  });

  it("handles missing optional config defaults", () => {
    const minimal = {
      id: "w1",
      name: "Min",
      rounds: 4,
      items: [{ id: "i1", type: "work", label: "W", duration: 20 }],
    };
    const res = normalizeWorkout(minimal);
    expect(res).not.toBeNull();
    expect(res?.prepare).toBeDefined();
    expect(res?.roundRest).toBeDefined();
    expect(typeof res?.skipLastRest).toBe("boolean");
  });
});

describe("useWorkoutsStore", () => {
  beforeEach(() => {
    useWorkoutsStore.setState({
      workouts: [
        {
          id: "w1",
          name: "Workout One",
          rounds: 4,
          items: [{ id: "i1", type: "work", label: "Work", duration: 20 }],
          prepare: { enabled: false, duration: 10 },
          roundRest: { enabled: false, duration: 10 },
          skipLastRest: false,
        },
      ],
    });
  });

  it("adds a workout", () => {
    const w2: Workout = {
      id: "w2",
      name: "Workout Two",
      rounds: 4,
      items: [{ id: "i2", type: "work", label: "Work", duration: 20 }],
      prepare: { enabled: false, duration: 10 },
      roundRest: { enabled: false, duration: 10 },
      skipLastRest: false,
    };
    useWorkoutsStore.getState().addWorkout(w2);
    expect(useWorkoutsStore.getState().workouts).toHaveLength(2);
    expect(useWorkoutsStore.getState().workouts[1].id).toBe("w2");
  });

  it("adds multiple workouts", () => {
    const list: Workout[] = [
      {
        id: "w2",
        name: "Two",
        rounds: 4,
        items: [{ id: "i2", type: "work", label: "W", duration: 20 }],
        prepare: { enabled: false, duration: 10 },
        roundRest: { enabled: false, duration: 10 },
        skipLastRest: false,
      },
    ];
    useWorkoutsStore.getState().addWorkouts(list);
    expect(useWorkoutsStore.getState().workouts).toHaveLength(2);
  });

  it("updates a workout", () => {
    const updated: Workout = {
      id: "w1",
      name: "Updated Name",
      rounds: 6,
      items: [{ id: "i1", type: "work", label: "Work", duration: 20 }],
      prepare: { enabled: false, duration: 10 },
      roundRest: { enabled: false, duration: 10 },
      skipLastRest: false,
    };
    useWorkoutsStore.getState().updateWorkout(updated);
    expect(useWorkoutsStore.getState().workouts[0].name).toBe("Updated Name");
    expect(useWorkoutsStore.getState().workouts[0].rounds).toBe(6);
  });

  it("deletes a workout", () => {
    useWorkoutsStore.getState().deleteWorkout("w1");
    expect(useWorkoutsStore.getState().workouts).toHaveLength(0);
  });

  it("duplicates a workout successfully and returns new id", () => {
    const newId = useWorkoutsStore.getState().duplicateWorkout("w1");
    expect(newId).toBeDefined();
    const workouts = useWorkoutsStore.getState().workouts;
    expect(workouts).toHaveLength(2);
    expect(workouts[1].name).toBe("Workout One (copy)");
    expect(workouts[1].id).not.toBe("w1");
    expect(workouts[1].items[0].id).not.toBe("i1");
  });

  it("returns undefined when duplicating non-existent workout", () => {
    const res = useWorkoutsStore.getState().duplicateWorkout("non-existent");
    expect(res).toBeUndefined();
  });

  it("persisted store migration normalizes workouts", () => {
    // Access persist options if possible or test migration logic indirectly / via store setup
    const persistOptions = (useWorkoutsStore as any).persist;
    if (persistOptions && persistOptions.getOptions) {
      const opts = persistOptions.getOptions();
      if (opts && opts.migrate) {
        const badState = {
          workouts: [
            { id: "valid", name: "Valid", rounds: 4, items: [{ id: "i", type: "work", label: "W", duration: 20 }] },
            { id: "", name: "Invalid" },
          ],
        };
        const migrated = opts.migrate(badState, 2);
        expect(migrated.workouts).toHaveLength(1);
        expect(migrated.workouts[0].id).toBe("valid");
      }
    }
  });
});
