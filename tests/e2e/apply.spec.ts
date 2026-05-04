import { test, expect } from "@playwright/test";

test.describe("/apply — application form", () => {
  test("renders all required fields", async ({ page }) => {
    await page.goto("/apply");
    for (const label of [
      "Your name",
      "Phone number",
      "Email",
      "Brand name",
      "Product category",
    ]) {
      await expect(page.getByLabel(label)).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: /submit application/i }),
    ).toBeVisible();
  });

  test("client-side validation blocks empty submit", async ({ page }) => {
    await page.goto("/apply");
    await page.getByRole("button", { name: /submit application/i }).click();
    // zod validation should surface "is too short" or "Invalid email"
    await expect(page.getByText(/too short|invalid email/i).first()).toBeVisible();
  });
});
