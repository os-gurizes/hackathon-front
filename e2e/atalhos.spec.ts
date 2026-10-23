import { expect, test } from "./fixtures";

// Dados de exemplo: o alerta de rotação é do Lotus, na defesa; o ponto forte do player é da Ascent.

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
});

test("alerta do time abre a prancheta já no mapa, no lado e com o título dele", async ({ page }) => {
  await page.goto("/coach/time");
  const alerta = page.getByRole("article").filter({ hasText: "Rotações sem informação no Lotus" });
  await alerta.getByRole("button", { name: "Abrir na prancheta" }).click();

  await expect(page).toHaveURL(/\/coach\/prancheta\?e=/);
  await expect(page.getByLabel("Nome da estratégia")).toHaveValue("Rotações sem informação no Lotus");
  await expect(page.getByText("Lotus · Defesa")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("aberta a partir do alerta");

  // Recarregar não cria outra estratégia
  await page.reload();
  await expect(page.getByLabel("Nome da estratégia")).toHaveValue("Rotações sem informação no Lotus");
  await expect(page.getByLabel("Estratégias salvas").locator("option")).toHaveCount(1);
});

test("alerta sem mapa não oferece abrir na prancheta", async ({ page }) => {
  await page.goto("/coach/time");
  const alerta = page.getByRole("article").filter({ hasText: "Force depois de perder o pistol" });
  await expect(alerta).toBeVisible();
  await expect(alerta.getByRole("button", { name: "Abrir na prancheta" })).toHaveCount(0);
});

test("Ver no mapa abre Meus mapas no mapa e na métrica do cartão", async ({ page }) => {
  await page.goto("/coach/time");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.getByLabel("E-mail").fill("jogador@salatatica.dev");
  await page.getByLabel("Senha").fill("x");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/player\/desempenho$/);

  const cartao = page.getByRole("article").filter({ hasText: "Sua Jett rende mais na Ascent" });
  await cartao.getByRole("link", { name: "Ver no mapa" }).click();
  await expect(page).toHaveURL(/\/player\/mapas\?mapa=ascent&metrica=kills/);
  await expect(page.getByRole("combobox", { name: "Mapa", exact: true }).locator("option:checked")).toContainText("Ascent");
  await expect(page.getByRole("button", { name: "Abates", exact: true })).toHaveAttribute("aria-pressed", "true");
});
