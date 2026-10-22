// Atualiza openapi/openapi.json a partir da API e gera os tipos em src/api/schema.d.ts.
// Uso:
//   node scripts/sync-openapi.mjs                          lê ../hackathon-api/openapi.json
//   node scripts/sync-openapi.mjs caminho/openapi.json     lê um arquivo
//   node scripts/sync-openapi.mjs http://localhost:3333/docs/json   lê da API rodando
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const source = process.argv[2] ?? "../hackathon-api/openapi.json";
const raw = source.startsWith("http") ? await (await fetch(source)).text() : readFileSync(source, "utf8");
const spec = JSON.parse(raw);

// O Fastify marca como obrigatório todo parâmetro de query com valor padrão, mas o servidor
// aplica o padrão sozinho: para o front, esses parâmetros são opcionais.
let fixed = 0;
for (const methods of Object.values(spec.paths)) {
  for (const op of Object.values(methods)) {
    for (const p of op.parameters ?? []) {
      if (p.in === "query" && p.required && p.schema?.default !== undefined) {
        p.required = false;
        fixed++;
      }
    }
  }
}

writeFileSync("openapi/openapi.json", JSON.stringify(spec, null, 2) + "\n");
console.log(`openapi.json atualizado (${Object.keys(spec.paths).length} rotas, ${fixed} parâmetros com padrão viraram opcionais)`);
execSync("npm run api:types", { stdio: "inherit" });
