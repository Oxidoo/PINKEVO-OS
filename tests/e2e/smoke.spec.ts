import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("landing page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("PINKEVO OS")).toBeVisible();
    await expect(page.getByRole("link", { name: /se connecter/i })).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
