import { buscarTermos, GLOSSARIO } from "./glossario";

describe("glossário", () => {
  it("tem as siglas que as telas usam", () => {
    const termos = GLOSSARIO.map((t) => t.termo);
    for (const sigla of ["K/D", "ACS", "ADR", "KAST", "HS%", "Trade", "Estimativa"]) expect(termos).toContain(sigla);
  });

  it("busca sem acento e sem diferença de maiúscula", () => {
    expect(buscarTermos("pos plant").map((t) => t.termo)).toEqual(["Pós-plant"]);
    expect(buscarTermos("kast")[0]?.termo).toBe("KAST");
    expect(buscarTermos("")).toHaveLength(GLOSSARIO.length);
    expect(buscarTermos("xyz123")).toEqual([]);
  });
});
