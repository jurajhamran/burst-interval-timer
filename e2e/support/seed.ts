import type { Page } from "@playwright/test";
import type { Workout } from "../../src/features/workouts/types/types";
import type { HistoryEntry } from "../../src/features/history/types/types";

/** Seeds persisted workouts before the app loads. */
export async function seedWorkouts(
  page: Page,
  workouts: Workout[],
): Promise<void> {
  await page.addInitScript((list) => {
    localStorage.setItem(
      "tabata-workouts",
      JSON.stringify({ state: { workouts: list }, version: 3 }),
    );
  }, workouts);
}

/** Seeds persisted history before the app loads. */
export async function seedHistory(
  page: Page,
  entries: HistoryEntry[],
): Promise<void> {
  await page.addInitScript((list) => {
    localStorage.setItem(
      "tabata-history",
      JSON.stringify({ state: { entries: list }, version: 1 }),
    );
  }, entries);
}
