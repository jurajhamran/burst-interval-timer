import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useTimerStore } from "@/features/timer/store";
import { makeWorkout } from "@/test/factories";

describe("useTimerStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    useTimerStore.setState(useTimerStore.getInitialState());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("start() -> index 0, running true, finished false", () => {
    useTimerStore.getState().start(makeWorkout());
    const s = useTimerStore.getState();
    expect(s.index).toBe(0);
    expect(s.running).toBe(true);
    expect(s.finished).toBe(false);
  });

  it("advancing time by first phase duration then tick() -> index 1", () => {
    useTimerStore.getState().start(makeWorkout());
    vi.advanceTimersByTime(20000);
    useTimerStore.getState().tick();
    expect(useTimerStore.getState().index).toBe(1);
  });

  it("long gap lands in correct phase with correct remainingMs", () => {
    useTimerStore.getState().start(makeWorkout());
    vi.advanceTimersByTime(45000);
    useTimerStore.getState().tick();
    const s = useTimerStore.getState();
    expect(s.index).toBe(2);
    expect(s.remainingMs).toBe(5000);
  });

  it("toggle pause then advance 60s then resume -> remainingMs unchanged", () => {
    useTimerStore.getState().start(makeWorkout());
    useTimerStore.getState().toggle(); // pause
    const pausedRemaining = useTimerStore.getState().remainingMs;
    vi.advanceTimersByTime(60000);
    useTimerStore.getState().toggle(); // resume
    expect(useTimerStore.getState().remainingMs).toBe(pausedRemaining);
  });

  it("running past last phase then tick() -> finished true, running false", () => {
    useTimerStore.getState().start(makeWorkout());
    vi.advanceTimersByTime(100000);
    useTimerStore.getState().tick();
    const s = useTimerStore.getState();
    expect(s.finished).toBe(true);
    expect(s.running).toBe(false);
  });

  it("skip advances to next phase and finishes on last", () => {
    useTimerStore.getState().start(makeWorkout());
    useTimerStore.getState().skip();
    expect(useTimerStore.getState().index).toBe(1);
    useTimerStore.getState().skip();
    useTimerStore.getState().skip();
    useTimerStore.getState().skip();
    const s = useTimerStore.getState();
    expect(s.finished).toBe(true);
    expect(s.running).toBe(false);
  });
});
