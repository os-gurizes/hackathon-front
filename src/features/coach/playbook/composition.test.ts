import { AGENTS } from "../../../map/mapData";
import { canJoin, teamOf } from "./composition";
import type { PlaybookItem, Side } from "./types";

const byName = (name: string) => AGENTS.find((a) => a.name === name)!.id;
let seq = 0;
const agent = (name: string, side: Side, phase: PlaybookItem["phase"] = "setup"): PlaybookItem => ({
  id: `i${seq++}`,
  phase,
  kind: "agent",
  agentId: byName(name),
  side,
  at: { x: 0.5, y: 0.5 },
});

describe("composição do time", () => {
  it("conta agentes distintos por lado, mesmo repetidos em fases", () => {
    const items = [agent("Jett", "attack"), agent("Jett", "attack", "exec"), agent("Omen", "attack"), agent("Sage", "defense")];
    expect(teamOf(items, "attack").agents.map((a) => a.name)).toEqual(["Jett", "Omen"]);
    expect(teamOf(items, "defense").agents.map((a) => a.name)).toEqual(["Sage"]);
  });

  it("aponta as funções que faltam", () => {
    const team = teamOf([agent("Jett", "attack"), agent("Omen", "attack")], "attack");
    expect(team.roleCounts).toMatchObject({ Duelista: 1, Controlador: 1, Iniciador: 0, Sentinela: 0 });
    expect(team.missingRoles).toEqual(["Iniciador", "Sentinela"]);
  });

  it("time vazio não mostra aviso de função", () => {
    expect(teamOf([], "defense").missingRoles).toEqual([]);
  });

  it("limita cinco agentes por lado, mas deixa repetir quem já está", () => {
    const five = ["Jett", "Omen", "Sova", "Killjoy", "Raze"].map((n) => agent(n, "attack"));
    expect(canJoin(five, byName("Sage"), "attack")).toBe(false);
    expect(canJoin(five, byName("Jett"), "attack")).toBe(true);
    expect(canJoin(five, byName("Sage"), "defense")).toBe(true);
  });
});
