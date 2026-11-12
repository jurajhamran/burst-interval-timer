import { create } from "zustand";
import type { Workout } from "@/features/workouts/types";
import { buildPhases, type Phase } from "./engine";

interface TimerState {
  phases: Phase[];
  index: number;
  running: boolean;
  finished: boolean;
  endsAt: number; // ms timestamp
  remainingMs: number;
  lastBeepSecond: number | null;
  onPhaseChange?: (newIndex: number, phase: Phase) => void;
  onSecondBeep?: (sec: number) => void;
  onFinish?: () => void;

  start: (workout: Workout) => void;
  toggle: () => void;
  skip: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  phases: [],
  index: 0,
  running: false,
  finished: false,
  endsAt: 0,
  remainingMs: 0,
  lastBeepSecond: null,

  start: (workout: Workout) => {
    const phases = buildPhases(workout);
    if (phases.length === 0) return;
    const first = phases[0];
    const durationMs = first.duration * 1000;
    const now = Date.now();
    set({
      phases,
      index: 0,
      running: true,
      finished: false,
      endsAt: now + durationMs,
      remainingMs: durationMs,
      lastBeepSecond: null,
    });
  },

  toggle: () => {
    const { running, endsAt } = get();
    const now = Date.now();
    if (running) {
      const remainingMs = Math.max(0, endsAt - now);
      set({ running: false, remainingMs });
    } else {
      const { remainingMs } = get();
      set({ running: true, endsAt: now + remainingMs });
    }
  },

  skip: () => {
    const { phases, index } = get();
    const nextIndex = index + 1;
    if (nextIndex >= phases.length) {
      set({ running: false, finished: true, remainingMs: 0 });
    } else {
      const nextPhase = phases[nextIndex];
      const durationMs = nextPhase.duration * 1000;
      const now = Date.now();
      set({
        index: nextIndex,
        endsAt: now + durationMs,
        remainingMs: durationMs,
        lastBeepSecond: null,
      });
    }
  },

  tick: () => {
    const { running, finished, endsAt, phases, index } = get();
    if (!running || finished) return;

    const now = Date.now();
    let remainingMs = endsAt - now;

    if (remainingMs <= 0) {
      // Advance phase(s) if multiple elapsed
      let currentIndex = index;
      let currentPhases = phases;
      let nextIndex = currentIndex + 1;

      while (nextIndex < currentPhases.length) {
        // Find how much time overflowed
        const overdue = -remainingMs;
        const nextPhase = currentPhases[nextIndex];
        const nextDurationMs = nextPhase.duration * 1000;

        if (overdue < nextDurationMs) {
          // This next phase is current
          const newEndsAt = now + (nextDurationMs - overdue);
          set({
            index: nextIndex,
            endsAt: newEndsAt,
            remainingMs: newEndsAt - now,
            lastBeepSecond: null,
          });
          return;
        } else {
          // Completely consumed this phase too, advance further
          remainingMs += nextDurationMs;
          currentIndex = nextIndex;
          nextIndex++;
        }
      }

      // Finished all phases
      set({ running: false, finished: true, remainingMs: 0 });
      return;
    }

    set({ remainingMs });
  },
}));
