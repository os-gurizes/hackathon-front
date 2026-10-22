import { historyReducer, initHistory, type History } from "./history";
import type { Playbook, PlaybookItem } from "./types";

const playbook: Playbook = {
  id: "p1",
  title: "Teste",
  mapId: "ascent",
  side: "attack",
  rotation: 0,
  items: [],
  visiblePhases: ["setup", "exec", "post", "retake"],
  background: "callouts",
  notes: { setup: "", exec: "", post: "", retake: "" },
  updatedAt: "2026-10-22T00:00:00.000Z",
};

const arrow = (id: string, phase: PlaybookItem["phase"] = "exec"): PlaybookItem => ({
  id,
  phase,
  kind: "arrow",
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.2, y: 0.2 },
  ],
});

const run = (h: History, ...actions: Parameters<typeof historyReducer>[1][]) => actions.reduce(historyReducer, h);
const ids = (h: History) => h.present.items.map((i) => i.id);

describe("pilha de desfazer", () => {
  it("desfaz e refaz na ordem", () => {
    let h = run(initHistory(playbook), { type: "add", item: arrow("a") }, { type: "add", item: arrow("b") });
    expect(ids(h)).toEqual(["a", "b"]);
    h = run(h, { type: "undo" });
    expect(ids(h)).toEqual(["a"]);
    h = run(h, { type: "undo" }, { type: "undo" });
    expect(ids(h)).toEqual([]);
    h = run(h, { type: "redo" }, { type: "redo" });
    expect(ids(h)).toEqual(["a", "b"]);
  });

  it("uma ação nova apaga o que dava para refazer", () => {
    const h = run(initHistory(playbook), { type: "add", item: arrow("a") }, { type: "undo" }, { type: "add", item: arrow("c") });
    expect(h.future).toEqual([]);
    expect(ids(run(h, { type: "redo" }))).toEqual(["c"]);
  });

  it("limpar uma fase remove só os itens dela e pode ser desfeito", () => {
    let h = run(
      initHistory(playbook),
      { type: "add", item: arrow("a", "setup") },
      { type: "add", item: arrow("b", "exec") },
      { type: "clearPhase", phase: "exec" },
    );
    expect(ids(h)).toEqual(["a"]);
    h = run(h, { type: "undo" });
    expect(ids(h)).toEqual(["a", "b"]);
  });

  it("mover um item é uma entrada só na pilha", () => {
    const h = run(initHistory(playbook), { type: "add", item: arrow("a") }, { type: "update", id: "a", patch: { phase: "post" } });
    expect(h.past).toHaveLength(2);
    expect(h.present.items[0]?.phase).toBe("post");
  });

  it("mudanças de vista não entram na pilha", () => {
    const h = run(initHistory(playbook), { type: "set", patch: { background: "minimap", visiblePhases: ["exec"] } });
    expect(h.past).toHaveLength(0);
    expect(h.present.background).toBe("minimap");
  });

  it("desfazer não volta a rotação nem o título", () => {
    const h = run(
      initHistory(playbook),
      { type: "add", item: arrow("a") },
      { type: "set", patch: { rotation: 90, title: "Novo" } },
      { type: "undo" },
    );
    expect(h.present.items).toEqual([]);
    expect(h.present.rotation).toBe(90);
    expect(h.present.title).toBe("Novo");
  });

  it("ações sem efeito não criam entradas", () => {
    const h = run(initHistory(playbook), { type: "remove", id: "nada" }, { type: "clearPhase", phase: "setup" }, { type: "undo" });
    expect(h.past).toHaveLength(0);
  });

  it("trocar de mapa limpa os itens e pode ser desfeito", () => {
    let h = run(initHistory(playbook), { type: "add", item: arrow("a") }, { type: "changeMap", mapId: "lotus", rotation: 90 });
    expect(h.present.items).toEqual([]);
    h = run(h, { type: "undo" });
    expect(h.present.mapId).toBe("ascent");
    expect(ids(h)).toEqual(["a"]);
  });
});
