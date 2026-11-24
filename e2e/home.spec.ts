import { test, expect } from "@playwright/test";

test.describe("workouts home", () => {
  test("shows the seeded workout and opens the preview", async ({ page }) => {
    await page.goto("/#/");

    await expect(
      page.getByRole("heading", { name: "Core Burner" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Preview Core Burner", exact: true })
      .click();

    await expect(page.getByRole("heading", { name: /Timeline/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Core Burner" }).last(),
    ).toBeVisible();
    await expect(page.getByText(/Timeline \(\d+ phases\)/)).toBeVisible();
  });

  test("starts a workout from the card", async ({ page }) => {
    await page.goto("/#/");

    await page
      .getByRole("button", { name: "Start Core Burner", exact: true })
      .click();

    await expect(page).toHaveURL(/#\/run\/seed-core/);
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });
});
