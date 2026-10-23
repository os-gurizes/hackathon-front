import { expect, test } from "./fixtures";

test.describe("primeiro acesso", () => {
  test.use({ tourVisto: false });

  test("o tour abre uma vez, pode ser pulado e reaberto em Como usar", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/coach/time");

    const tour = page.getByRole("dialog", { name: "Meu time" });
    await expect(tour).toBeVisible();
    await tour.getByRole("button", { name: "Próximo" }).click();
    await expect(page.getByRole("dialog", { name: "Prancheta" })).toBeVisible();
    await page.getByRole("button", { name: "Pular" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Como usar" }).click();
    await expect(page.getByRole("dialog", { name: "Meu time" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test("o glossário abre de qualquer tela e busca sem acento", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/coach/prancheta");

  await page.getByRole("button", { name: "Glossário" }).click();
  const painel = page.getByRole("dialog", { name: "Glossário" });
  await expect(painel).toContainText("KAST");
  await painel.getByRole("searchbox").fill("pos plant");
  await expect(painel).toContainText("Depois da spike plantada");
  await expect(painel).not.toContainText("KAST");
  await page.keyboard.press("Escape");
  await expect(painel).toHaveCount(0);
});
