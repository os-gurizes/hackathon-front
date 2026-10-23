# Camada de API do front

Tudo em `src/api/`. As telas não chamam `fetch`: usam as queries prontas, que já trazem tipos, cache e tratamento de erro.

## Rodar

```
cp .env.example .env.local
npm run dev
```

- `VITE_API_MOCK=true`: usa os dados de exemplo de `src/api/mocks` (não precisa da API).
- `VITE_API_MOCK=false`: chama a API de verdade. Em dev, o Vite repassa `/api` para `VITE_API_PROXY` (padrão `http://localhost:3333`), então o cookie de sessão funciona sem configurar CORS.

Nos mocks, a sessão começa como **coach**. Para ver como **player**, faça login com um e-mail que tenha "jogador" (ex.: `jogador@salatatica.dev`, qualquer senha). A senha `errada` devolve 401, para testar a tela de erro.

## Usar numa tela

```tsx
import { useQuery } from "@tanstack/react-query";
import { q, type TeamEconomy } from "../../api";

function EconomiaDoTime({ teamId, mapId }: { teamId: number; mapId?: number }) {
  const { data, isPending, error } = useQuery(q.teams.economy(teamId, { map: mapId }));
  if (isPending) return <Carregando />;
  if (error) return <p>{error.message}</p>; // mensagem já vem em pt-BR
  return <Matriz linhas={data.matrix} />;    // data é TeamEconomy, tipado
}
```

- `q.me()`, `q.teams.get(id)`, `q.players.stats(id, filtros)`, `q.maps.heatmap(id, { metric: "kills" })`, `q.insights({ scope: "team", id })` e as demais estão em `src/api/queries.ts`.
- Os filtros são os da API (`tournament`, `stage`, `map`, `side`, `team`, `agent`) e o TypeScript recusa filtro que a rota não aceita.
- Para ações (login, salvar playbook), use os serviços direto: `await authService.login({ email, password })`.
- Erros chegam como `ApiError` com `code` (`NOT_FOUND`, `FORBIDDEN`...), `status` e `message` em pt-BR.
- Sessão expirada (401) é renovada sozinha pelo refresh, uma vez.

## Tipos

`import type { TeamDetail, PlayerStats, Insight, Heatmap } from "../../api"`. A lista completa está em `src/api/types.ts`. Os tipos saem do `openapi.json` da API: nada de escrever tipo de resposta à mão.

## Quando a API mudar

```
npm run api:sync                                  # lê ../hackathon-api/openapi.json
npm run api:sync -- http://localhost:3333/docs/json   # ou da API rodando
```

Isso atualiza `openapi/openapi.json` e `src/api/schema.d.ts`. Se algum serviço ou mock ficar diferente do contrato novo, `npm run typecheck` aponta onde.

## Rota sem dado de exemplo

Ela responde 501 com a mensagem "Ainda sem dado de exemplo para...". Para adicionar:

1. Em `src/api/mocks/data.ts`, crie o dado com o tipo da resposta (ex.: `export const TEAM_COMBOS: TeamCombos = {...}`). O TypeScript confere se bate com a API.
2. Em `src/api/mocks/handlers.ts`, adicione a rota antes da última linha (`http.all`): `http.get(url("/teams/:id/combos"), authed(() => HttpResponse.json(TEAM_COMBOS)))`.

Hoje têm mock: login, logout, refresh, `/me`, `/maps`, `/agents`, `/teams`, `/teams/:id`, `/teams/:id/economy`, `/insights`, `/maps/:id/stats`, `/maps/:id/heatmap`, `/players/:id`, `/players/:id/stats` e `/players/:id/matches`. Isso cobre "Meu time", "Meu desempenho" e "Meus mapas".

## Nota para a API

O `openapi.json` exportado marca como obrigatórios os parâmetros de query que têm valor padrão (`limit`, `sort`, `minRounds`, `metric`, `resolution`). O `api:sync` corrige isso ao copiar; o ideal é a exportação já sair com `required: false` nesses casos.

## Deploy na Vercel

O `vercel.json` faz em produção o que o proxy do Vite faz em dev: `/api/*` e `/auth/*` vão para a API pelo próprio domínio do front (assim os cookies de sessão funcionam) e qualquer outra rota abre o app.

- **A URL da API está escrita no `vercel.json`.** Se o túnel do ngrok reiniciar, a URL muda: troque nas duas linhas de `rewrites` e faça um novo deploy. Um domínio fixo do ngrok (a conta gratuita tem um) evita isso.
- Não configure `VITE_API_MOCK` nem `VITE_API_URL` na Vercel.
- Para testar o build antes de subir: `npm run build` e `npm run preview` (usa o mesmo proxy, lendo `VITE_API_PROXY` do `.env.local`).
