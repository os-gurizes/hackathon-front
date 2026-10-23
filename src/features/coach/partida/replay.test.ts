import { MATCH_ROUNDS, ROUND_REPLAY, TEAM } from "../../../api/mocks/data";
import { clock, deathsUntil, describe as describeEvent, resultLabel, snapshotAt, spikeAt, teamWinCurve } from "./replay";

const { events, players } = ROUND_REPLAY(0);

describe("replay do round", () => {
  it("relógio no formato do jogo", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(65_400)).toBe("1:05");
    expect(clock(-10)).toBe("0:00");
  });

  it("tempo esgotado aparece quando o resultado vem vazio", () => {
    expect(resultLabel("Defuse")).toBe("Desarme");
    expect(resultLabel("")).toBe("Tempo esgotado");
    expect(resultLabel(null)).toBe("Tempo esgotado");
  });

  it("posições do último abate valem até o próximo, mesmo em plant", () => {
    expect(snapshotAt(events, 0)).toHaveLength(3);
    expect(snapshotAt(events, 1)).toBe(snapshotAt(events, 0));
    expect(snapshotAt(events, 2)).toHaveLength(2);
    expect(snapshotAt([], 0)).toEqual([]);
  });

  it("mortes se acumulam e a spike aparece só depois do plant", () => {
    expect(deathsUntil(events, 0).map((d) => d.playerId)).toEqual([201]);
    expect(deathsUntil(events, 3).map((d) => d.playerId)).toEqual([201, 202]);
    expect(spikeAt(events, 0)).toBeNull();
    expect(spikeAt(events, 1)).toEqual({ x: 0.29, y: 0.33 });
  });

  it("descreve os eventos em português, com primeiro abate e trade", () => {
    expect(describeEvent(events[0]!, players)).toBe("Vento (Jett) abateu Lobo (Raze): primeiro abate");
    expect(describeEvent(events[1]!, players)).toBe("Uivo (Omen) plantou a spike no B");
    expect(describeEvent(events[2]!, players)).toBe("Faisca (Killjoy) abateu Uivo (Omen): trade");
    expect(describeEvent(events[3]!, players)).toBe("Vento (Jett) desarmou a spike no B");
  });

  it("a curva de chance é a do time, mesmo quando ele defende", () => {
    const round = MATCH_ROUNDS[0]!;
    expect(round.attackTeamId).not.toBe(TEAM.id);
    const curve = teamWinCurve(round, TEAM.id);
    expect(curve[0]!.p).toBeCloseTo(0.5);
    expect(curve.at(-1)!.p).toBeCloseTo(0.95);
  });
});
