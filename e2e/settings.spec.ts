import { test, expect } from "@playwright/test";

test.describe("settings", () => {
  test("countdown beeps toggle persists after reload", async ({ page }) => {
    await page.goto("/#/settings");

    const toggle = page.getByRole("switch", { name: "Countdown beeps" });
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");

    await page.reload();
    await expect(
      page.getByRole("switch", { name: "Countdown beeps" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  test("shows a backup reminder when never backed up", async ({ page }) => {
    await page.goto("/#/settings");

    await expect(page.getByText("Never backed up")).toBeVisible();
    await expect(
      page.getByText(/Export a backup to keep them safe/i),
    ).toBeVisible();
  });

  test("exporting a backup updates the last backup date", async ({ page }) => {
    await page.goto("/#/settings");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^tabata-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    await expect(page.getByText("Last backup: Today")).toBeVisible();
    await expect(
      page.getByText(/Export a backup to keep them safe/i),
    ).toHaveCount(0);
    await expect(page.getByText("Backup exported")).toBeVisible();
  });
});
