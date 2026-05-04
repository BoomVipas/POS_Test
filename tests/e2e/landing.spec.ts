import { test, expect } from "@playwright/test";

test.describe("/ — marketing landing", () => {
  test("renders hero + CTA", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /POS built for/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /apply to join the pilot/i }),
    ).toBeVisible();
  });

  test("apply CTA navigates to /apply", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /apply to join the pilot/i }).click();
    await expect(page).toHaveURL(/\/apply$/);
    await expect(
      page.getByRole("heading", { name: /Apply to join the pilot/i }),
    ).toBeVisible();
  });
});
