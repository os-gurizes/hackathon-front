import { test as base, expect } from "@playwright/test";

// O tour do primeiro acesso cobre a tela. Os testes partem de um navegador limpo, então o tour é
// marcado como visto antes de cada página carregar; quem testa o tour usa `test.use({ tourVisto: false })`.
export const test = base.extend<{ tourVisto: boolean }>({
  tourVisto: [true, { option: true }],
  page: async ({ page, tourVisto }, run) => {
    if (tourVisto) {
      await page.addInitScript(() => {
        localStorage.setItem("sala-tatica:tour-visto:coach", "1");
        localStorage.setItem("sala-tatica:tour-visto:player", "1");
      });
    }
    await run(page);
  },
});

export { expect };
