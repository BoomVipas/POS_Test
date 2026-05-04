import { test, expect } from "@playwright/test";

test.describe("/app/pos — POS demo", () => {
  test("renders product grid", async ({ page }) => {
    await page.goto("/app/pos");
    // Mock catalog has DEMO-001 through DEMO-008.
    for (const sku of ["DEMO-001", "DEMO-002", "DEMO-003"]) {
      await expect(page.getByText(sku, { exact: true })).toBeVisible();
    }
  });

  test("clicking a product adds it to the cart", async ({ page }) => {
    await page.goto("/app/pos");
    await page.getByText("Cat Hoodie").first().click();
    // Cart line should appear with the SKU and the qty 1.
    await expect(page.getByText("DEMO-001").nth(1)).toBeVisible();
    // Total updates from "—" / 0 to 890 THB.
    await expect(page.locator("text=890")).toBeVisible();
  });

  test("review CTA disabled until payment method picked", async ({ page }) => {
    await page.goto("/app/pos");
    await page.getByText("Cat Hoodie").first().click();
    const cta = page.getByRole("button", { name: /pick a payment method/i });
    await expect(cta).toBeVisible();
    await expect(cta).toBeDisabled();
    await page.getByRole("button", { name: "Cash", exact: true }).click();
    await expect(
      page.getByRole("button", { name: /review & confirm/i }),
    ).toBeEnabled();
  });
});
