import { AGENTS } from "../../../map/mapData";
import { canJoin, checkPlacement, teamOf } from "./composition";
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

describe("regras de colocação por fase", () => {
  it("o mesmo agente entra uma vez por lado em cada fase", () => {
    const jett = agent("Jett", "attack", "setup");
    const items = [jett];
    const again = checkPlacement(items, byName("Jett"), "attack", "setup");
    expect(again.ok).toBe(false);
    expect(again.ok === false && again.reason === "placed" && again.existing.id).toBe(jett.id);
  });

  it("pode estar no ataque e na defesa da mesma fase, e de novo em outra fase", () => {
    const items = [agent("Jett", "attack", "setup")];
    expect(checkPlacement(items, byName("Jett"), "defense", "setup").ok).toBe(true);
    expect(checkPlacement(items, byName("Jett"), "attack", "exec").ok).toBe(true);
  });

  it("com ataque e defesa ocupados, a terceira Jett na fase é recusada", () => {
    const items = [agent("Jett", "attack", "setup"), agent("Jett", "defense", "setup")];
    expect(checkPlacement(items, byName("Jett"), "attack", "setup").ok).toBe(false);
    expect(checkPlacement(items, byName("Jett"), "defense", "setup").ok).toBe(false);
  });

  it("trocar de lado olha o outro lado sem contar o próprio marcador", () => {
    const own = agent("Omen", "attack", "exec");
    expect(checkPlacement([own], byName("Omen"), "defense", "exec", own.id).ok).toBe(true);
    const blocked = [own, agent("Omen", "defense", "exec")];
    expect(checkPlacement(blocked, byName("Omen"), "defense", "exec", own.id).ok).toBe(false);
  });

  it("time cheio recusa agente novo com o motivo certo", () => {
    const five = ["Jett", "Omen", "Sova", "Killjoy", "Raze"].map((n) => agent(n, "attack"));
    const r = checkPlacement(five, byName("Sage"), "attack", "setup");
    expect(r.ok === false && r.reason).toBe("full");
  });
});
