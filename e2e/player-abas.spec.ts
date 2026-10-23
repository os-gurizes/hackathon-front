import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/coach/time");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.getByLabel("E-mail").fill("jogador@salatatica.dev");
  await page.getByLabel("Senha").fill("x");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/player\/desempenho$/);
});

test("as abas do player abrem com a frase-resumo de cada tela", async ({ page }) => {
  await page.getByRole("link", { name: "Partidas", exact: true }).click();
  await expect(page).toHaveURL(/\/player\/partidas$/);
  await expect(page.getByText(/Você venceu 7 de 10 partidas/)).toBeVisible();
  await page.getByRole("combobox", { name: "Mapa" }).selectOption({ label: "Ascent" });
  await expect(page.getByText(/partidas na Ascent/)).toBeVisible();

  await page.getByRole("link", { name: "Armas", exact: true }).click();
  await expect(page.getByText(/A Vandal é a sua arma principal: 112 abates/)).toBeVisible();
  await expect(page.getByText("(amostra pequena)")).toBeVisible();

  await page.getByRole("link", { name: "Agentes", exact: true }).click();
  await expect(page.getByText(/Jett é o seu agente principal: 7 partidas/)).toBeVisible();
  await expect(page.getByText("Estimativa")).toBeVisible();

  await page.getByRole("link", { name: "Meus padrões", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Morte sem apoio do time" })).toBeVisible();
  await expect(page.getByText(/2,0 vezes a média/)).toBeVisible();

  await page.getByRole("link", { name: "Sob pressão", exact: true }).click();
  await expect(page.getByText(/Você cresce em clutch: vence 8 p.p. acima da média/)).toBeVisible();
  await expect(page.getByText(/em pós-plant, fica 11 p.p. abaixo/)).toBeVisible();
});

test("o padrão leva para Meus mapas no mapa e lado certos", async ({ page }) => {
  await page.goto("/player/padroes");
  await page.getByRole("link", { name: "Ver no mapa" }).first().click();
  await expect(page).toHaveURL(/\/player\/mapas\?mapa=sunset&lado=attack&metrica=deaths/);
});
