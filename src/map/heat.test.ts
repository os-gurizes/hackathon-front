import { buildPalette, normalize } from "./heat";

describe("heatmap", () => {
  it("a paleta vai da primeira à última cor da escala", () => {
    const lut = buildPalette(["#000000", "#ff0000"]);
    expect([lut[0], lut[1], lut[2]]).toEqual([0, 0, 0]);
    expect([lut[255 * 3], lut[255 * 3 + 1], lut[255 * 3 + 2]]).toEqual([255, 0, 0]);
    expect(lut[128 * 3]).toBeGreaterThan(120);
    expect(lut[128 * 3]).toBeLessThan(135);
  });

  it("intensidade relativa ao maior valor, limitada entre 0 e 1", () => {
    const cells = [
      { x: 0, y: 0, value: 2 },
      { x: 1, y: 0, value: 4 },
      { x: 2, y: 0, value: 9 },
    ];
    expect(normalize(cells).map((c) => c.t)).toEqual([2 / 9, 4 / 9, 1]);
    expect(normalize(cells, 4).map((c) => c.t)).toEqual([0.5, 1, 1]);
  });

  it("sem valor positivo não desenha nada", () => {
    expect(normalize([{ x: 0, y: 0, value: 0 }])).toEqual([]);
    expect(normalize([])).toEqual([]);
  });
});
