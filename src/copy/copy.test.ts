import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(__dirname, "..");
const FORBIDDEN: Array<[string, RegExp]> = [
  ["travessão (U+2014)", new RegExp(String.fromCharCode(0x2014))],
  ["meia-risca (U+2013)", new RegExp(String.fromCharCode(0x2013))],
  ["emoji", /\p{Extended_Pictographic}/u],
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx|json|css)$/.test(name) ? [path] : [];
  });
}

describe("texto da interface (anti-slop)", () => {
  const files = walk(SRC);

  it("encontra arquivos para varrer", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [relative(SRC, f), f]))("%s não tem travessão nem emoji", (_name, file) => {
    const lines = readFileSync(file, "utf8").split("\n");
    const hits = lines.flatMap((line, i) =>
      FORBIDDEN.filter(([, re]) => re.test(line)).map(([what]) => `linha ${i + 1}: ${what}`),
    );
    expect(hits).toEqual([]);
  });
});
