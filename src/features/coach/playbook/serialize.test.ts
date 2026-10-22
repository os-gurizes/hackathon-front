import { decodeShare, encodeShare, parsePlaybook, readShareFromHash, shareUrl } from "./serialize";
import { LocalPlaybookRepository } from "./repository";
import type { Playbook } from "./types";

const playbook: Playbook = {
  id: "p1",
  title: "Execução rápida no B",
  mapId: "ascent",
  side: "attack",
  rotation: 90,
  items: [
    { id: "a", phase: "setup", kind: "agent", agentId: "jett", at: { x: 0.5, y: 0.9 } },
    { id: "b", phase: "exec", kind: "ability", abilityId: "omen-Ability2", at: { x: 0.3, y: 0.3 }, rotation: 45 },
    { id: "c", phase: "exec", kind: "arrow", points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }] },
    { id: "d", phase: "post", kind: "text", at: { x: 0.2, y: 0.2 }, text: "Plant aqui" },
  ],
  visiblePhases: ["setup", "exec"],
  background: "minimap",
  notes: { setup: "Base", exec: "Entrada em 15 s", post: "", retake: "" },
  updatedAt: "2026-10-22T10:00:00.000Z",
};

describe("parsePlaybook", () => {
  it("mantém uma estratégia válida igual", () => {
    expect(parsePlaybook(JSON.parse(JSON.stringify(playbook)))).toEqual(playbook);
  });

  it("recusa o que não tem id ou mapa", () => {
    expect(parsePlaybook(null)).toBeNull();
    expect(parsePlaybook({ title: "x" })).toBeNull();
    expect(parsePlaybook("texto")).toBeNull();
  });

  it("descarta itens inválidos e completa campos que faltam", () => {
    const p = parsePlaybook({
      id: "x",
      mapId: "lotus",
      rotation: 45,
      items: [{ kind: "agent", phase: "exec" }, { kind: "laser", phase: "exec" }, playbook.items[2]],
    });
    expect(p?.items.map((i) => i.id)).toEqual(["c"]);
    expect(p?.rotation).toBe(0);
    expect(p?.visiblePhases).toEqual(["setup", "exec", "post", "retake"]);
    expect(p?.notes.retake).toBe("");
  });
});

describe("link compartilhável", () => {
  it("ida e volta preservam o conteúdo, com id novo", () => {
    const back = decodeShare(encodeShare(playbook));
    expect(back).not.toBeNull();
    expect(back!.id).not.toBe(playbook.id);
    expect({ ...back!, id: playbook.id, updatedAt: playbook.updatedAt }).toEqual(playbook);
  });

  it("lê do hash da URL e aguenta acento", () => {
    const url = shareUrl(playbook, "http://localhost/");
    const back = readShareFromHash(new URL(url).hash);
    expect(back?.title).toBe("Execução rápida no B");
  });

  it("link corrompido não quebra", () => {
    expect(decodeShare("@@@")).toBeNull();
    expect(readShareFromHash("#s=abc")).toBeNull();
    expect(readShareFromHash("")).toBeNull();
  });
});

describe("LocalPlaybookRepository", () => {
  beforeEach(() => localStorage.clear());

  it("salva, lista e lê", async () => {
    const repo = new LocalPlaybookRepository();
    await repo.save(playbook);
    expect(await repo.get("p1")).toEqual(playbook);
    expect((await repo.list()).map((s) => s.title)).toEqual(["Execução rápida no B"]);
  });

  it("duplica com id e título novos", async () => {
    const repo = new LocalPlaybookRepository();
    await repo.save(playbook);
    const copy = await repo.duplicate("p1");
    expect(copy?.id).not.toBe("p1");
    expect(copy?.title).toBe("Execução rápida no B (cópia)");
    expect(copy?.items).toEqual(playbook.items);
    expect(await repo.list()).toHaveLength(2);
  });

  it("ignora armazenamento corrompido", async () => {
    localStorage.setItem("sala-tatica:playbooks", "{quebrado");
    expect(await new LocalPlaybookRepository().list()).toEqual([]);
  });
});
