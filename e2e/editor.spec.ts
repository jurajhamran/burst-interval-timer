import { test, expect } from "@playwright/test";

test.describe("workout editor", () => {
  test("new workout starts with the default settings", async ({ page }) => {
    await page.goto("/#/workout/new");

    await page.locator("button[aria-expanded]").click();

    await expect(page.getByRole("textbox", { name: "Rounds" })).toHaveValue(
      "4",
    );

    const durations = page.getByRole("textbox", { name: "Duration" });
    await expect(durations.nth(0)).toHaveValue("0:45");
    await expect(durations.nth(1)).toHaveValue("0:15");
  });

  test("rest rows have a fixed name", async ({ page }) => {
    await page.goto("/#/workout/new");

    await expect(
      page.getByRole("textbox", { name: "Exercise name" }),
    ).toHaveCount(1);

    const restRow = page.locator("[data-item-id]").nth(1);
    await expect(
      restRow.getByText("Rest", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      restRow.getByRole("textbox", { name: "Exercise name" }),
    ).toHaveCount(0);
  });

  test("requires an exercise name", async ({ page }) => {
    await page.goto("/#/workout/new");

    await page.getByLabel("Workout name").fill("Valid name");
    await page.getByLabel("Exercise name").fill("");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Give this exercise a name")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New workout" }),
    ).toBeVisible();
  });

  test("caps workout and exercise names at their limits", async ({ page }) => {
    await page.goto("/#/workout/new");

    const workoutName = page.getByLabel("Workout name");
    await workoutName.pressSequentially("w".repeat(55));
    await expect(workoutName).toHaveValue("w".repeat(50));

    const exercise = page.getByLabel("Exercise name");
    await exercise.fill("");
    await exercise.pressSequentially("e".repeat(65));
    await expect(exercise).toHaveValue("e".repeat(60));
  });

  test("creates a workout from the editor", async ({ page }) => {
    await page.goto("/#/workout/new");

    await page.getByLabel("Workout name").fill("E2E Workout");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Workout created")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "E2E Workout" }),
    ).toBeVisible();
  });

  test("edits an existing workout", async ({ page }) => {
    await page.goto("/#/");
    await page.getByRole("heading", { name: "Core Burner" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit workout" }),
    ).toBeVisible();

    await page.getByLabel("Workout name").fill("Edited Burner");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Workout saved")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Edited Burner" }),
    ).toBeVisible();
  });

  test("deletes a workout", async ({ page }) => {
    await page.goto("/#/");
    await page.getByRole("heading", { name: "Core Burner" }).click();

    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete workout" }).click();

    await expect(page.getByText('Delete "Core Burner"?')).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page.getByText("Workout deleted")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Core Burner" }),
    ).toHaveCount(0);
  });
});
