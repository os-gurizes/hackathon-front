import { expect, test } from "./fixtures";

// Com os dados de exemplo, a sessão começa como coach; e-mail com "jogador" entra como player.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("coach cai em Meu time e só vê as abas de coach", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/coach\/time$/);
  const nav = page.getByRole("navigation", { name: "Visão do coach" });
  await expect(nav.getByRole("link", { name: "Prancheta" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Heatmap" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Visão do player" })).toHaveCount(0);

  await nav.getByRole("link", { name: "Prancheta" }).click();
  await expect(page).toHaveURL(/\/coach\/prancheta/);
  await expect(page.getByRole("img", { name: /Prancheta sobre o minimapa/ })).toBeVisible();
});

test("sair leva ao login e o player entra na visão dele", async ({ page }) => {
  await page.goto("/coach/time");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("E-mail").fill("jogador@salatatica.dev");
  await page.getByLabel("Senha").fill("qualquer");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/player\/desempenho$/);
  const nav = page.getByRole("navigation", { name: "Visão do player" });
  await expect(nav.getByRole("link", { name: "Meus mapas" })).toBeVisible();
  await expect(page.getByText("Vento")).toBeVisible();

  // Rota de coach não abre para player: volta para a tela inicial dele
  await page.goto("/coach/prancheta");
  await expect(page).toHaveURL(/\/player\/desempenho$/);
});

test("senha errada mostra o erro sem sair da tela", async ({ page }) => {
  await page.goto("/coach/time");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.getByLabel("E-mail").fill("coach@salatatica.dev");
  await page.getByLabel("Senha").fill("errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toContainText("E-mail ou senha incorretos.");
  await expect(page).toHaveURL(/\/login$/);
});

test("Meus mapas mostra o heatmap, a frase-resumo e a tabela de zonas", async ({ page }) => {
  await page.goto("/coach/time");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.getByLabel("E-mail").fill("jogador@salatatica.dev");
  await page.getByLabel("Senha").fill("x");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("link", { name: "Meus mapas" }).click();

  await expect(page.getByRole("img", { name: /Heatmap de presença/ })).toBeVisible();
  await expect(page.getByText(/Você passa mais tempo em/)).toBeVisible();
  await expect(page.getByRole("table")).toContainText("A Site");

  await page.getByRole("button", { name: "Mortes" }).click();
  await expect(page.getByText(/Você morre mais em/)).toBeVisible();
});
