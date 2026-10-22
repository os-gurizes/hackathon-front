import { clampView, mapToScreen, rotatePoint, screenToMap, zoomAt, type View } from "./transform";
import { attackDownRotation, MAPS } from "./mapData";

const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 9);
  expect(a.y).toBeCloseTo(b.y, 9);
};

describe("rotatePoint", () => {
  it("gira 90 graus no sentido horário em torno do centro", () => {
    close(rotatePoint({ x: 0.5, y: 0 }, 90), { x: 1, y: 0.5 });
    close(rotatePoint({ x: 1, y: 0.5 }, 90), { x: 0.5, y: 1 });
  });

  it("quatro rotações de 90 voltam ao ponto inicial", () => {
    const p = { x: 0.21, y: 0.83 };
    close([90, 90, 90, 90].reduce((acc, d) => rotatePoint(acc, d), p), p);
  });
});

describe("mapToScreen e screenToMap", () => {
  const views: View[] = [
    { zoom: 1, x: 0, y: 0 },
    { zoom: 2.5, x: -300, y: -120 },
  ];

  it.each([0, 90, 180, 270] as const)("são inversos com rotação %i", (rotation) => {
    for (const view of views) {
      const p = { x: 0.3, y: 0.71 };
      close(screenToMap(mapToScreen(p, rotation, view, 760), rotation, view, 760), p);
    }
  });

  it("o centro do mapa fica no centro da tela sem zoom em qualquer rotação", () => {
    close(mapToScreen({ x: 0.5, y: 0.5 }, 270, { zoom: 1, x: 0, y: 0 }, 800), { x: 400, y: 400 });
  });
});

describe("zoom e limites", () => {
  it("o ponto sob o cursor fica parado ao dar zoom", () => {
    const view = { zoom: 1, x: 0, y: 0 };
    const cursor = { x: 200, y: 600 };
    const before = screenToMap(cursor, 0, view, 800);
    const after = screenToMap(cursor, 0, zoomAt(view, cursor, 2, 800), 800);
    close(after, before);
  });

  it("não deixa o mapa sair da área visível", () => {
    expect(clampView({ zoom: 2, x: 50, y: -5000 }, 800)).toEqual({ zoom: 2, x: 0, y: -800 });
    expect(clampView({ zoom: 0.5, x: -10, y: 0 }, 800)).toEqual({ zoom: 1, x: 0, y: 0 });
  });
});

describe("dados dos mapas", () => {
  it("carrega os 10 mapas do dataset com callouts", () => {
    expect(MAPS).toHaveLength(10);
    for (const m of MAPS) expect(m.callouts.length).toBeGreaterThan(10);
  });

  it("a rotação automática deixa o spawn de ataque embaixo", () => {
    for (const m of MAPS) {
      const attack = m.callouts.find((c) => c.side === "attack");
      const defense = m.callouts.find((c) => c.side === "defense");
      if (!attack || !defense) continue;
      const rot = attackDownRotation(m.callouts);
      expect(rotatePoint(attack, rot).y).toBeGreaterThan(rotatePoint(defense, rot).y);
    }
  });
});
