import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
});

test("análise de partida percorre o replay de um round e guarda o link", async ({ page }) => {
  await page.goto("/coach/time");
  await page.getByRole("link", { name: "Análise de partida" }).click();

  await expect(page.getByRole("heading", { name: /Corvos do Campus 13 x 9 Lobos da Federal/ })).toBeVisible();
  await expect(page.getByText("Round 1: vitória na defesa por desarme, spike plantada no B.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Replay do round 1 na Ascent/ })).toBeVisible();

  const atual = page.locator("[aria-current=step]");
  await expect(atual).toContainText("Vento (Jett) abateu Lobo (Raze): primeiro abate");
  await page.getByRole("button", { name: "Próximo evento" }).click();
  await expect(atual).toContainText("plantou a spike no B");
  await page.getByRole("button", { name: /Desarmou|desarmou/ }).click();
  await expect(atual).toContainText("desarmou a spike");
  await expect(page.getByRole("button", { name: "Próximo evento" })).toBeDisabled();

  await page.getByRole("button", { name: /Round 2: derrota/ }).click();
  await expect(page.getByText(/Round 2: derrota na defesa/)).toBeVisible();
  await expect(page).toHaveURL(/partida=9100&round=1/);

  await page.reload();
  await expect(page.getByText(/Round 2: derrota na defesa/)).toBeVisible();
});
