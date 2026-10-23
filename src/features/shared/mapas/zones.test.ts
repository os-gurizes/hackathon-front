import { compareZone, type Zone } from "./zones";

const zone = (zoneId: number, value: number, sampleSize = 20): Zone => ({
  zoneId,
  name: `Zona ${zoneId}`,
  value,
  sampleSize,
  tradeRate: 0.3,
  presence: 0,
  kills: 0,
  deaths: 0,
  firstKills: 0,
  firstDeaths: 0,
  tradedDeaths: 0,
});

describe("comparação da zona com o campeonato", () => {
  it("compara a fatia do total que cai na zona", () => {
    const mine = [zone(1, 40), zone(2, 60)]; // 40% na zona 1
    const all = [zone(1, 200), zone(2, 800)]; // 20% na zona 1
    expect(compareZone("deaths", mine[0]!, mine, all)).toEqual({ text: "2,0x a média", tone: "up" });
    expect(compareZone("deaths", mine[1]!, mine, all)?.tone).toBe("down");
  });

  it("perto da média vira 'na média'", () => {
    const mine = [zone(1, 50), zone(2, 50)];
    const all = [zone(1, 510), zone(2, 490)];
    expect(compareZone("kills", mine[0]!, mine, all)).toEqual({ text: "na média", tone: "even" });
  });

  it("K/D compara pela diferença", () => {
    const mine = [zone(1, 1.3)];
    const all = [zone(1, 1.0)];
    expect(compareZone("kd", mine[0]!, mine, all)).toEqual({ text: "+0,30 vs. média", tone: "up" });
  });

  it("sem base ou com amostra pequena não compara", () => {
    expect(compareZone("kills", zone(1, 10), [zone(1, 10)], [])).toBeNull();
    expect(compareZone("kills", zone(1, 10, 3), [zone(1, 10, 3)], [zone(1, 100)])).toBeNull();
  });
});
