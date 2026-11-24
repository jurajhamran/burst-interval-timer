import { test, expect } from "@playwright/test";
import { historyEntries } from "./fixtures/history";
import { seedHistory } from "./support/seed";

test.describe("history", () => {
  test("deletes a single entry", async ({ page }) => {
    await seedHistory(page, historyEntries);
    await page.goto("/#/history");

    await expect(page.getByText("Core Burner")).toBeVisible();
    await expect(page.getByText("Morning Mobility")).toBeVisible();

    await page.getByRole("button", { name: "Delete entry" }).first().click();
    await expect(page.getByText("Delete this entry?")).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page.getByText("Core Burner")).toHaveCount(0);
    await expect(page.getByText("Morning Mobility")).toBeVisible();
  });

  test("clears all history", async ({ page }) => {
    await seedHistory(page, historyEntries);
    await page.goto("/#/history");

    await page.getByRole("button", { name: "Clear history" }).click();
    await expect(page.getByText("Clear all history?")).toBeVisible();
    await page.getByRole("button", { name: "Clear", exact: true }).click();

    await expect(page.getByText("No sessions yet")).toBeVisible();
  });
});
