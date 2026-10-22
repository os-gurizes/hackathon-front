// Copia do pacote assets-valorant só o que a prancheta usa e gera JSONs enxutos em src/map/data.
// Uso: node scripts/copy-assets.mjs [caminho do pacote]
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2] ?? "C:/Users/almir.gomes/projetos/Valorant-DragAndDrop/assets-valorant";
const OUT = "public/assets-valorant";
const DATA = "src/map/data";
// Os 10 mapas do dataset do hackathon
const MAPS = ["abyss", "ascent", "breeze", "fracture", "haven", "lotus", "pearl", "split", "summit", "sunset"];

const copy = (rel) => {
  const from = join(SRC, rel);
  if (!existsSync(from)) return;
  cpSync(from, join(OUT, rel), { recursive: true });
};

mkdirSync(OUT, { recursive: true });
mkdirSync(DATA, { recursive: true });

for (const m of MAPS) {
  copy(`mapas/${m}/minimapa.png`);
  copy(`mapas/${m}/lista.png`);
}
for (const a of readdirSync(join(SRC, "agentes"))) {
  copy(`agentes/${a}/minimapa.png`);
  copy(`agentes/${a}/habilidades`);
}
copy("funcoes");

const weaponsRaw = JSON.parse(readFileSync(join(SRC, "dados/armas.json"), "utf8")).filter((w) => w.preco != null);
for (const w of weaponsRaw) copy(w.imagens.silhueta);

const maps = JSON.parse(readFileSync(join(SRC, "dados/mapas.json"), "utf8"))
  .filter((m) => MAPS.includes(m.nome.toLowerCase()))
  .map((m) => ({
    id: m.id,
    slug: m.nome.toLowerCase(),
    name: m.nome,
    minimap: m.imagens.minimapa,
    banner: m.imagens.lista,
    metersToMinimap: m.metros_para_minimapa,
    callouts: m.callouts.map((c) => ({ region: c.regiao, name: c.nome, x: c.minimapa.x, y: c.minimapa.y })),
  }));

const agents = JSON.parse(readFileSync(join(SRC, "dados/agentes.json"), "utf8")).map((a) => ({
  id: a.id,
  name: a.nome,
  role: a.funcao,
  color: a.cores?.[0] ?? null,
  icon: a.imagens.minimapa,
  abilities: a.habilidades
    .filter((h) => ["Grenade", "Ability1", "Ability2", "Ultimate"].includes(h.slot))
    .map((h) => ({ slot: h.slot, key: h.tecla, name: h.nome, icon: h.icone })),
}));

const weapons = weaponsRaw.map((w) => ({ id: w.id, name: w.nome, category: w.categoria, cost: w.preco, icon: w.imagens.silhueta }));

writeFileSync(join(DATA, "weapons.json"), JSON.stringify(weapons, null, 1) + "\n");
writeFileSync(join(DATA, "maps.json"), JSON.stringify(maps, null, 1) + "\n");
writeFileSync(join(DATA, "agents.json"), JSON.stringify(agents, null, 1) + "\n");
console.log(`${maps.length} mapas, ${agents.length} agentes, ${weapons.length} armas`);
