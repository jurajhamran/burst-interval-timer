import { test, expect } from "@playwright/test";
import { fastWorkout } from "./fixtures/workouts";
import { seedWorkouts } from "./support/seed";

test.describe("timer", () => {
  test("pauses and resumes the countdown", async ({ page }) => {
    await page.goto("/#/");
    await page
      .getByRole("button", { name: "Start Core Burner", exact: true })
      .click();

    const countdown = page.locator(".timer-countdown");
    await expect(countdown).toBeVisible();

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();

    const paused = await countdown.textContent();
    await page.waitForTimeout(700);
    await expect(countdown).toHaveText(paused ?? "");

    await page.getByRole("button", { name: "Resume" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("stop warns before leaving the workout", async ({ page }) => {
    await page.goto("/#/");
    await page
      .getByRole("button", { name: "Start Core Burner", exact: true })
      .click();

    await page.getByRole("button", { name: "Stop workout" }).click();
    await expect(
      page.getByText("Stop workout?", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Keep going" }).click();
    await expect(page.locator(".timer-countdown")).toBeVisible();

    await page.getByRole("button", { name: "Stop workout" }).click();
    await page.getByRole("button", { name: "Stop", exact: true }).click();

    await expect(
      page.getByRole("button", { name: "Start Core Burner", exact: true }),
    ).toBeVisible();
  });

  test("shows the finish screen after the last phase", async ({ page }) => {
    await seedWorkouts(page, [fastWorkout]);
    await page.goto("/#/run/e2e-fast");

    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Back" }),
    ).toBeVisible();
  });

  test("records a finished workout in history", async ({ page }) => {
    await seedWorkouts(page, [fastWorkout]);
    await page.goto("/#/run/e2e-fast");

    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Back" }).click();

    await page.getByRole("link", { name: "History" }).click();

    const rows = page.getByTestId("session-entry");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Fast Test");
    await expect(rows.first()).toContainText("1 rounds");
  });
});
