import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
});

async function entrarComoPlayer(page: import("@playwright/test").Page) {
  await page.goto("/coach/time");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.getByLabel("E-mail").fill("jogador@salatatica.dev");
  await page.getByLabel("Senha").fill("x");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/player\/desempenho$/);
}

test("filtrar o heatmap grava os filtros na URL e o link reabre igual", async ({ page }) => {
  await entrarComoPlayer(page);
  await page.goto("/player/mapas");
  const mapa = page.getByRole("combobox", { name: "Mapa", exact: true });
  await expect(mapa).toBeVisible();

  await mapa.selectOption("ascent");
  await page.getByRole("button", { name: "Mortes" }).click();
  await page.getByRole("button", { name: "Defesa" }).click();

  await expect(page).toHaveURL(/mapa=ascent/);
  await expect(page).toHaveURL(/metrica=deaths/);
  await expect(page).toHaveURL(/lado=defense/);

  // O mesmo link, aberto de novo, volta na mesma leitura
  await page.goto(page.url());
  await expect(page.getByRole("button", { name: "Mortes" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Defesa" })).toHaveAttribute("aria-pressed", "true");
  await expect(mapa.locator("option:checked")).toContainText("Ascent");
});

test("coach estuda o adversário pelo seletor de time", async ({ page }) => {
  await page.goto("/coach/heatmap");
  await expect(page.getByRole("heading", { name: /Heatmap do time: Corvos do Campus/ })).toBeVisible();

  const time = page.getByRole("combobox", { name: "Time", exact: true });
  const value = await time.locator("option", { hasText: "Lobos da Federal" }).getAttribute("value");
  await time.selectOption(value!);

  await expect(page.getByRole("heading", { name: /Heatmap do adversário: Lobos da Federal/ })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`time=${value}`));
  await expect(page.getByRole("columnheader", { name: "Contra a média" })).toBeVisible();
});
