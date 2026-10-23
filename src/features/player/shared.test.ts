import { describe, expect, it } from "vitest";
import { diff, pct, pp, tone } from "./shared";

describe("comparações do player", () => {
  it("formata taxa em porcentagem pt-BR", () => {
    expect(pct(0.583)).toBe("58%");
    expect(pct(0.583, 1)).toBe("58,3%");
  });

  it("mostra a diferença em pontos percentuais com sinal", () => {
    expect(pp(0.58, 0.53)).toBe("+5,0 p.p.");
    expect(pp(0.49, 0.52)).toBe("-3,0 p.p.");
  });

  it("mostra a diferença simples com sinal", () => {
    expect(diff(1.18, 1)).toBe("+0,18");
    expect(diff(0.9, 1)).toBe("-0,10");
  });

  it("fica neutro perto da média e respeita quando menor é melhor", () => {
    expect(tone(0.54, 0.53, 0.02)).toBe("neutral");
    expect(tone(0.6, 0.53, 0.02)).toBe("up");
    expect(tone(0.6, 0.53, 0.02, false)).toBe("down");
  });
});
