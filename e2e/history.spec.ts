import { test, expect } from "@playwright/test";
import { historyEntries, historySpread } from "./fixtures/history";
import { seedHistory } from "./support/seed";

test.describe("history", () => {
  test("deletes a single entry", async ({ page }) => {
    await seedHistory(page, historyEntries);
    await page.goto("/#/history");

    const rows = page.getByTestId("session-entry");
    const coreRow = rows.filter({ hasText: "Core Burner" });

    await expect(rows).toHaveCount(2);
    await expect(coreRow).toBeVisible();
    await expect(rows.filter({ hasText: "Morning Mobility" })).toBeVisible();

    await page.getByRole("button", { name: "Delete entry" }).first().click();
    await expect(page.getByText("Delete this entry?")).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(coreRow).toHaveCount(0);
    await expect(rows.filter({ hasText: "Morning Mobility" })).toBeVisible();
  });

  test("clears all history", async ({ page }) => {
    await seedHistory(page, historyEntries);
    await page.goto("/#/history");

    await page.getByRole("button", { name: "Clear history" }).click();
    await expect(page.getByText("Clear all history?")).toBeVisible();
    await page.getByRole("button", { name: "Clear", exact: true }).click();

    await expect(page.getByText("No sessions yet")).toBeVisible();
  });

  test("charts training volume and switches the range", async ({ page }) => {
    await seedHistory(page, historySpread);
    await page.goto("/#/history");

    const volume = page.getByRole("region", { name: "Training volume" });
    const breakdown = page.getByRole("region", { name: "Time by workout" });

    await expect(volume).toBeVisible();
    await expect(breakdown).toBeVisible();

    const volumeSummary = volume.locator("figcaption");
    await expect(volumeSummary).toContainText("last 7 days");
    await expect(volumeSummary).toContainText("31m across 3 sessions");
    await expect(page.getByText("+11m vs previous 7 days")).toBeVisible();

    const bars = volume.locator(".recharts-bar-rectangle");
    await expect(bars).toHaveCount(3);

    await page.getByRole("button", { name: "30 days" }).click();

    await expect(
      page.getByRole("button", { name: "30 days" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(volumeSummary).toContainText("last 30 days");
    await expect(volumeSummary).toContainText("51m across 4 sessions");
    await expect(bars).toHaveCount(4);

    await expect(
      breakdown.getByText("All time", { exact: true }),
    ).toBeVisible();
    await expect(breakdown.locator("figcaption")).toContainText("Core Burner");
  });
});
