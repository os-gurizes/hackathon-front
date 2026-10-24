# Sala Tática

App web que transforma as partidas reais do campeonato universitário de VALORANT em leitura simples para coaches e jogadores: o que acontece, quanto custa e onde treinar.

Feito para o hackathon de dados de VALORANT da SEMCOMP (USP São Carlos). Este repositório é o front. Os dados vêm da [API](https://github.com/os-gurizes/hackathon-api), que lê o banco montado pelo [ETL](https://github.com/os-gurizes/hackathon-etl) a partir dos JSONs oficiais do hackathon.

## O que tem em cada visão

Toda tela abre com uma frase-resumo e o gráfico vem como evidência. Siglas têm explicação no Glossário (botão no topo) e o botão "Como usar" refaz o tour da tela.

**Coach** (o admin vê as mesmas telas e escolhe o time em "Time em análise")

| Aba | O que mostra |
|---|---|
| Meu time | Resumo do time, desempenho por mapa e lado, e os alertas que mais custam rounds |
| Análise de partida | Replay 2D de cada round: posições a cada abate, trocas, spike e chance de vitória |
| Prancheta | Estratégia por fases com agentes, habilidades, armas e o heatmap do time ao fundo; link compartilhável |
| Estratégias | Execuções do time e a taxa de vitória de cada uma contra o campeonato |
| Elenco | Jogadores do time; cada um abre a visão de player em modo leitura |
| Economia do time | Vitória por tipo de compra, nossa e do adversário |
| Heatmap | Presença, abates, mortes e primeiro abate por mapa e lado; serve para estudar o adversário |

**Player**

| Aba | O que mostra |
|---|---|
| Meu desempenho | Seus números contra a sua média e as últimas partidas, e os pontos que mais pesam |
| Meus mapas | Seu heatmap por mapa, lado e métrica |
| Meus padrões | Erros que se repetem, quanto custam e onde acontecem |
| Sob pressão | Clutch, pós-plant, match point e outras situações contra a média do campeonato |
| Armas | Vitória, HS% e distância por arma contra quem usa a mesma arma |
| Agentes | Desempenho por agente e abates com habilidade |
| Partidas | Histórico com placar, agente e K/D de cada jogo |

**Admin**: além das telas de coach, a aba Contas cria contas de coach e player e liga cada uma ao seu time ou jogador.

Abas esmaecidas no menu (Pressão e rotações, Combos, Scouting, Economia do player) ainda não existem.

## Rodar na sua máquina

Precisa de Node 20.19 ou mais novo.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:5173.

### Sem a API (dados de exemplo)

Com `VITE_API_MOCK=true` no `.env.local` (o padrão), o app usa os dados fictícios de `src/api/mocks` e não precisa de mais nada. O login aceita qualquer senha, e o papel sai do e-mail:

| E-mail com | Entra como |
|---|---|
| `admin` (ex.: `admin@salatatica.dev`) | admin |
| `jogador` ou `player` (ex.: `jogador@salatatica.dev`) | player |
| qualquer outro | coach |

A senha `errada` devolve erro, para testar a tela de login.

### Com a API de verdade

No `.env.local`:

```
VITE_API_MOCK=false
VITE_API_PROXY=http://localhost:3333
```

`VITE_API_PROXY` é onde a API está rodando (local, na rede ou num túnel do ngrok). O Vite repassa `/api` e `/auth` para lá, então os cookies de sessão funcionam sem configurar CORS. As contas são as criadas na API; peça ao time da API se não tiver uma.

## Scripts

| Comando | Faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:5173 |
| `npm run build` | Confere os tipos e gera o build em `dist/` |
| `npm run preview` | Serve o build com o mesmo proxy do dev |
| `npm run typecheck` | Só a checagem de tipos |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (Vitest) |
| `npm run e2e` | Testes de ponta a ponta (Playwright, sempre com os dados de exemplo) |
| `npm run api:sync` | Atualiza o contrato da API e os tipos gerados |

Na primeira vez que for rodar o e2e: `npx playwright install chromium`.

## Estrutura

```
src/
  api/        cliente, queries, tipos gerados do openapi.json e mocks
  app/        sessão, rotas, abas, layout, tour e glossário
  design/     tokens de cor e tipografia e componentes base
  features/   uma pasta por tela: coach/, player/, admin/, auth/, shared/
  map/        mapas, agentes, armas e o canvas com zoom e heatmap
  copy/       textos fixos: glossário, estimativas e aviso legal
e2e/          testes do Playwright
openapi/      cópia do contrato da API
docs/         guias do time
```

Coordenadas de mapa são normalizadas de 0 a 1, no mesmo espaço do ETL.

## Mais detalhes

- [docs/API-FRONT.md](docs/API-FRONT.md): como uma tela consome a API, como adicionar um mock, deploy na Vercel e como mostrar para o time pelo ngrok.
- [docs/spec-batch-3-front.md](docs/spec-batch-3-front.md): o spec das telas.

## Convenções

- Textos em português do Brasil, sem travessão e sem emoji; um teste (`src/copy/copy.test.ts`) confere isso.
- Todo número aparece com uma comparação (média do jogador, do time ou do campeonato).
- Uma branch por tarefa e commits curtos no imperativo, em português.

## Aviso legal

O Sala Tática não é endossado pela Riot Games e não reflete as visões ou opiniões da Riot Games nem de qualquer pessoa oficialmente envolvida na produção ou no gerenciamento das propriedades da Riot Games. Riot Games e todas as propriedades associadas são marcas comerciais ou marcas registradas da Riot Games, Inc.
