import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const status = (page: Page) => page.locator("[data-status]");
const phase = (page: Page, name: string) => page.getByRole("button", { name: new RegExp(`^${name}\\s+\\d+ ite`) });

/** Arrasta no canvas usando posições relativas (0..1) do quadro do mapa. */
async function dragOnMap(page: Page, from: [number, number], to: [number, number]) {
  const box = await page.getByRole("img", { name: /Prancheta sobre o minimapa/ }).boundingBox();
  if (!box) throw new Error("Canvas da prancheta não encontrado");
  const at = ([x, y]: [number, number]) => [box.x + x * box.width, box.y + y * box.height] as const;
  await page.mouse.move(...at(from));
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    await page.mouse.move(box.x + (from[0] + (to[0] - from[0]) * t) * box.width, box.y + (from[1] + (to[1] - from[1]) * t) * box.height);
  }
  await page.mouse.up();
}

async function clickOnMap(page: Page, [x, y]: [number, number]) {
  const box = await page.getByRole("img", { name: /Prancheta sobre o minimapa/ }).boundingBox();
  if (!box) throw new Error("Canvas da prancheta não encontrado");
  await page.mouse.click(box.x + x * box.width, box.y + y * box.height);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/coach/prancheta");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/coach/prancheta");
  await expect(status(page)).toHaveAttribute("data-status", "saved");
});

test("cria uma estratégia, recarrega e ela continua igual", async ({ page }) => {
  await page.getByLabel("Nome da estratégia").fill("Execução rápida no B");

  await page.getByRole("button", { name: "Seta", exact: true }).click();
  await dragOnMap(page, [0.45, 0.85], [0.35, 0.55]);

  await page.getByText("Execução", { exact: true }).click();
  await page.getByRole("button", { name: "Área", exact: true }).click();
  await dragOnMap(page, [0.25, 0.3], [0.3, 0.3]);

  await page.getByRole("button", { name: "Omen", exact: true }).click();
  await clickOnMap(page, [0.5, 0.75]);

  await page.getByLabel(/Notas da fase/).fill("Entrada em até 15 segundos.");

  await expect(phase(page, "Setup")).toContainText("1 item");
  await expect(phase(page, "Execução")).toContainText("2 itens");

  // O indicador passa por "Salvando" e chega a "Salvo" depois do debounce
  await expect(status(page)).toHaveAttribute("data-status", "saved", { timeout: 5000 });
  const url = page.url();
  expect(url).toMatch(/\?e=/);

  await page.reload();
  await expect(status(page)).toHaveAttribute("data-status", "saved");
  expect(page.url()).toBe(url);
  await expect(page.getByLabel("Nome da estratégia")).toHaveValue("Execução rápida no B");
  await expect(phase(page, "Setup")).toContainText("1 item");
  await expect(phase(page, "Execução")).toContainText("2 itens");

  // As notas são por fase: a página reabre no Setup, e a nota escrita está na Execução
  await expect(page.getByLabel(/Notas da fase/)).toHaveValue("");
  await page.getByText("Execução", { exact: true }).click();
  await expect(page.getByLabel(/Notas da fase/)).toHaveValue("Entrada em até 15 segundos.");
});

test("desfazer remove o último desenho e o resultado também persiste", async ({ page }) => {
  await page.getByRole("button", { name: "Seta", exact: true }).click();
  await dragOnMap(page, [0.4, 0.8], [0.4, 0.5]);
  await dragOnMap(page, [0.6, 0.8], [0.6, 0.5]);
  await expect(phase(page, "Setup")).toContainText("2 itens");

  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(phase(page, "Setup")).toContainText("1 item");
  await expect(status(page)).toHaveAttribute("data-status", "saved", { timeout: 5000 });

  await page.reload();
  await expect(phase(page, "Setup")).toContainText("1 item");
});

test("duplicar cria uma cópia separada da original", async ({ page }) => {
  await page.getByLabel("Nome da estratégia").fill("Retake A");
  await page.getByRole("button", { name: "Seta", exact: true }).click();
  await dragOnMap(page, [0.5, 0.8], [0.5, 0.5]);
  await expect(status(page)).toHaveAttribute("data-status", "saved", { timeout: 5000 });

  await page.getByRole("button", { name: "Duplicar" }).click();
  await expect(page.getByLabel("Nome da estratégia")).toHaveValue("Retake A (cópia)");
  await expect(phase(page, "Setup")).toContainText("1 item");

  await page.getByRole("button", { name: "Limpar Setup" }).click();
  await expect(phase(page, "Setup")).toContainText("0 itens");
  await expect(status(page)).toHaveAttribute("data-status", "saved", { timeout: 5000 });

  await page.getByLabel("Estratégias salvas").selectOption({ label: "Retake A · Ascent" });
  await expect(page.getByLabel("Nome da estratégia")).toHaveValue("Retake A");
  await expect(phase(page, "Setup")).toContainText("1 item");
});

test("menu do agente troca arma e lado, põe habilidade perto dele e tudo persiste", async ({ page }) => {
  const pieces = page.getByRole("complementary", { name: "Agentes, habilidades e mapa" });
  await pieces.getByRole("button", { name: "Omen", exact: true }).click();
  await clickOnMap(page, [0.5, 0.8]);

  await page.getByRole("button", { name: "Selecionar e mover" }).click();
  await clickOnMap(page, [0.5, 0.8]);
  const menu = page.getByRole("dialog", { name: "Opções de Omen" });
  await menu.getByRole("button", { name: "Vandal" }).click();
  await expect(menu).toContainText("Arma: Vandal");
  await menu.getByRole("button", { name: /Manto Sombrio/ }).click();
  await menu.getByRole("button", { name: "Defesa" }).click();
  await expect(phase(page, "Setup")).toContainText("2 itens");

  const composition = page.getByRole("complementary", { name: /Composição/ });
  await expect(composition).toContainText("Defesa1 de 5");

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(status(page)).toHaveAttribute("data-status", "saved", { timeout: 5000 });

  await page.reload();
  await expect(status(page)).toHaveAttribute("data-status", "saved");
  await expect(page.getByRole("complementary", { name: /Composição/ })).toContainText("Defesa1 de 5");
  await page.getByRole("button", { name: "Selecionar e mover" }).click();
  await clickOnMap(page, [0.5, 0.8]);
  await expect(page.getByRole("dialog", { name: "Opções de Omen" })).toContainText("Arma: Vandal");
});

test("não deixa um sexto agente entrar no mesmo lado", async ({ page }) => {
  const pieces = page.getByRole("complementary", { name: "Agentes, habilidades e mapa" });
  const names = ["Jett", "Omen", "Sova", "Killjoy", "Raze"];
  for (const [i, name] of names.entries()) {
    await pieces.getByRole("button", { name, exact: true }).click();
    await clickOnMap(page, [0.3 + i * 0.1, 0.8]);
  }
  await pieces.getByRole("button", { name: "Sage", exact: true }).click();
  await clickOnMap(page, [0.5, 0.6]);
  await expect(page.getByRole("status")).toContainText("já tem 5 agentes");
  await expect(phase(page, "Setup")).toContainText("5 itens");
});

test("vários cliques depois de escolher a Jett põem uma Jett só", async ({ page }) => {
  const pieces = page.getByRole("complementary", { name: "Agentes, habilidades e mapa" });
  await pieces.getByRole("button", { name: "Jett", exact: true }).click();
  await clickOnMap(page, [0.4, 0.8]);
  await clickOnMap(page, [0.5, 0.8]);
  await clickOnMap(page, [0.6, 0.8]);
  await expect(phase(page, "Setup")).toContainText("1 item");
  await expect(page.getByRole("button", { name: "Selecionar e mover" })).toHaveAttribute("aria-pressed", "true");
});

test("em cada fase a Jett entra uma vez no ataque e uma na defesa", async ({ page }) => {
  const pieces = page.getByRole("complementary", { name: "Agentes, habilidades e mapa" });
  const jett = pieces.getByRole("button", { name: /^Jett/ });

  await jett.click();
  await clickOnMap(page, [0.4, 0.8]);
  await pieces.getByRole("button", { name: "Entra na defesa" }).click();
  await jett.click();
  await clickOnMap(page, [0.4, 0.3]);
  await expect(phase(page, "Setup")).toContainText("2 itens");

  // A terceira não entra: abre o menu da Jett que já está na defesa
  await jett.click();
  await expect(page.getByRole("status")).toContainText("Jett já está na defesa na fase Setup");
  await expect(page.getByRole("dialog", { name: "Opções de Jett" })).toBeVisible();
  await expect(phase(page, "Setup")).toContainText("2 itens");

  // Em outra fase ela pode entrar de novo
  await page.getByText("Execução", { exact: true }).click();
  await jett.click();
  await clickOnMap(page, [0.45, 0.5]);
  await expect(phase(page, "Execução")).toContainText("1 item");
});
