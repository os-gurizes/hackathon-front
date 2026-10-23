import { expect, test } from "./fixtures";

// Dados de exemplo: e-mail com "admin" entra como admin, sem time próprio.
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/coach/time");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.getByLabel("E-mail").fill("admin@salatatica.dev");
  await page.getByLabel("Senha").fill("qualquer");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/coach\/time$/);
});

test("admin escolhe o time em análise e as telas de coach acompanham", async ({ page }) => {
  const seletor = page.getByRole("combobox", { name: "Time em análise" });
  await expect(seletor).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Visão do coach" }).getByRole("link", { name: "Contas" })).toBeVisible();

  const lobos = await seletor.locator("option", { hasText: "Lobos da Federal" }).getAttribute("value");
  await seletor.selectOption(lobos!);
  await page.getByRole("link", { name: "Heatmap" }).click();
  await expect(page.getByRole("heading", { name: /Heatmap do time: Lobos da Federal/ })).toBeVisible();

  // A escolha fica lembrada ao recarregar
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Time em análise" }).locator("option:checked")).toContainText("Lobos da Federal");
});

test("admin cria uma conta de player vinculada ao jogador do elenco e edita outra", async ({ page }) => {
  await page.getByRole("link", { name: "Contas" }).click();
  await expect(page.getByText(/4 contas: 2 coaches, 1 players e 1 admin/)).toBeVisible();

  const nova = page.getByRole("region", { name: "Nova conta" });
  await nova.getByLabel("E-mail").fill("player.vento@salatatica.dev");
  await nova.getByLabel("Senha").fill("curta");
  await nova.getByRole("button", { name: "Criar conta" }).click();
  await expect(nova.getByRole("alert")).toContainText("8 caracteres");

  await nova.getByLabel("Senha").fill("senha-segura");
  await nova.getByRole("combobox", { name: "Papel" }).selectOption("player");
  const time = nova.getByRole("combobox", { name: "Time" });
  await time.selectOption((await time.locator("option", { hasText: "Corvos do Campus" }).getAttribute("value"))!);
  const jogador = nova.getByRole("combobox", { name: "Jogador" });
  await expect(jogador.locator("option", { hasText: "Vento#BR1" })).toHaveCount(1);
  await jogador.selectOption((await jogador.locator("option", { hasText: "Vento#BR1" }).getAttribute("value"))!);
  await nova.getByRole("button", { name: "Criar conta" }).click();

  await expect(page.getByRole("status")).toContainText("Conta player.vento@salatatica.dev criada.");
  const linha = page.getByRole("row", { name: /player\.vento@salatatica\.dev/ });
  await expect(linha).toContainText("Corvos do Campus");
  await expect(linha).toContainText("Vento");

  await page.getByRole("button", { name: "Editar coach.lobos@salatatica.dev" }).click();
  const editar = page.getByRole("dialog", { name: /Editar coach\.lobos/ });
  await editar.getByRole("combobox", { name: "Papel" }).selectOption("admin");
  await editar.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toContainText("Conta coach.lobos@salatatica.dev atualizada.");
  await expect(page.getByRole("row", { name: /coach\.lobos@salatatica\.dev/ })).toContainText("Admin");
});

test("nenhuma tela de coach pede vínculo de time ao admin", async ({ page }) => {
  for (const aba of ["Meu time", "Análise de partida", "Estratégias", "Elenco", "Economia do time", "Heatmap"]) {
    await page.getByRole("navigation", { name: "Visão do coach" }).getByRole("link", { name: aba, exact: true }).click();
    await expect(page.getByText("Sua conta ainda não está ligada a um time")).toHaveCount(0);
    await expect(page.getByText("Escolha um time em Time em análise")).toHaveCount(0);
  }
});
