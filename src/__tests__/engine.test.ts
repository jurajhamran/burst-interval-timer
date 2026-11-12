import { describe, it, expect } from "vitest";
import { buildPhases, getTotalSeconds } from "@/features/timer/engine";
import { makeWorkout } from "@/test/factories";

describe("buildPhases", () => {
  it("2 items x 2 rounds all options off -> work,rest,work,rest rounds 1,1,2,2", () => {
    const phases = buildPhases(makeWorkout());
    expect(phases.map((p) => p.type)).toEqual(["work", "rest", "work", "rest"]);
    expect(phases.map((p) => p.round)).toEqual([1, 1, 2, 2]);
  });

  it("prepare enabled -> first phase prepare round 0 correct duration; only one prepare", () => {
    const phases = buildPhases(
      makeWorkout({ prepare: { enabled: true, duration: 5 } }),
    );
    expect(phases[0].type).toBe("prepare");
    expect(phases[0].round).toBe(0);
    expect(phases[0].duration).toBe(5);
    expect(phases.filter((p) => p.type === "prepare")).toHaveLength(1);
  });

  it("roundRest enabled with 3 rounds -> exactly 2 round-rest, none after last", () => {
    const phases = buildPhases(
      makeWorkout({
        rounds: 3,
        roundRest: { enabled: true, duration: 30 },
      }),
    );
    expect(phases.filter((p) => p.type === "round-rest")).toHaveLength(2);
  });

  it("skipLastRest true removes final trailing rest; false keeps it", () => {
    const withSkip = buildPhases(makeWorkout({ skipLastRest: true }));
    const withoutSkip = buildPhases(makeWorkout({ skipLastRest: false }));
    expect(withSkip).toHaveLength(3);
    expect(withSkip[withSkip.length - 1].type).toBe("work");
    expect(withoutSkip).toHaveLength(4);
    expect(withoutSkip[withoutSkip.length - 1].type).toBe("rest");
  });

  it("skipLastRest true when template ends with work removes nothing", () => {
    const workout = makeWorkout({
      items: [{ id: "a", type: "work", label: "Work", duration: 20 }],
      skipLastRest: true,
    });
    const phases = buildPhases(workout);
    expect(phases).toHaveLength(2);
    expect(phases[phases.length - 1].type).toBe("work");
  });

  it("getTotalSeconds equals sum of phase durations for all options", () => {
    const workout = makeWorkout({
      rounds: 3,
      prepare: { enabled: true, duration: 5 },
      roundRest: { enabled: true, duration: 30 },
      skipLastRest: true,
    });
    const phases = buildPhases(workout);
    const sum = phases.reduce((s, p) => s + p.duration, 0);
    expect(getTotalSeconds(workout)).toBe(sum);
  });
});
