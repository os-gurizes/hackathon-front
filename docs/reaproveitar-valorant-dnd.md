# O que reaproveitar do Valorant Drag & Drop

Repositório: `C:\Users\almir.gomes\projetos\Valorant-DragAndDrop\repo` (React 18, JS, styled-components, interação com pointer events em DOM + SVG).

## Portar (lógica, convertendo para TypeScript)

| Arquivo | O que tem | Para onde vai |
|---|---|---|
| `src/data/abilityShapes.js` | Tabela de formas das habilidades em metros (smoke = área, parede, direção/cone, tripwire), `pointAt`, `angleTo` | `src/map/abilityShapes.ts` |
| `src/api/valorant.js` | Conversão mundo do jogo para minimapa (`toMinimap`), callouts com tipo (site, spawn, região), rotação que deixa o ataque embaixo (`attackDownRotation`), `metersToPercent`, armas com custo, habilidades que viram arma | `src/map/mapData.ts`. Pode trocar a busca na valorant-api pelos JSONs locais do pacote `assets-valorant` |
| `src/strategy.js` | Serialização compacta da estratégia, link compartilhável (`#s=` em base64url), autosave em localStorage com debounce, tolerância a dados antigos | `src/features/coach/playbook/serialize.ts` e o adaptador local do `PlaybookRepository` |
| `src/App.jsx` | Rotação do mapa em 90 graus girando os itens junto (`rotatePosition`), tripwire com segunda ponta | dentro do store da prancheta |
| `src/components/footer/MapCallouts.jsx` | Callouts girando com o mapa e texto sempre em pé | camada de callouts no `MapCanvas` |
| `src/components/footer/AbilityShapes.jsx` | Desenho de cada forma e posição da alça de mira | reescrever como shapes do Konva |
| `src/components/footer/Footer.jsx` | Zoom no ponto do cursor (`zoomAt`), limites da vista (`clampView`), pan, arrastar itens, alças | lógica de zoom e pan do `MapCanvas` (Konva tem `scale` e `position` no Stage) |

## Descartar

- styled-components, cores e fontes antigas (Inter, `#1a1a1a`, `border-radius`, `box-shadow`): tudo vira tokens do Sala Tática.
- `react-draggable` e `react-zoom-pan-pinch` (já não eram usados de fato; o Konva cobre).
- Logo e ícones próprios do site antigo (`src/assets/*`).

## O que a prancheta nova tem a mais (spec, seção 8)

- Camadas por fase: setup, execução, pós-plant, retake. Visibilidade alternável e animação simples que percorre as fases.
- Ferramentas: caneta livre, seta, área, marcador de agente, texto, borracha, desfazer e refazer (pilha de comandos), limpar camada.
- Fundos: só o minimapa, minimapa com callouts, heatmap do time ou do adversário, cluster de estratégia.
- Salvamento automático (1,5 s) com indicador "Salvo", duplicar, compartilhar com o elenco, exportar PNG.
- Players veem as estratégias compartilhadas em modo de leitura.

## Modelo de dados sugerido

Todas as posições em espaço normalizado 0..1 sobre o minimapa (o mesmo do `MapCanvas` e do heatmap). Cada item pertence a uma fase.

```ts
type Phase = "setup" | "exec" | "post" | "retake";
type Side = "attack" | "defense";
type Point = { x: number; y: number };

type PlaybookItem =
  | { id: string; phase: Phase; kind: "agent"; agentId: string; side: Side; at: Point; weaponId?: string }
  | { id: string; phase: Phase; kind: "ability"; abilityId: string; ownerId?: string; side: Side; at: Point; rotation: number; end?: Point }
  | { id: string; phase: Phase; kind: "arrow"; points: Point[] }
  | { id: string; phase: Phase; kind: "pen"; points: Point[] }
  | { id: string; phase: Phase; kind: "area"; points: Point[] }
  | { id: string; phase: Phase; kind: "text"; at: Point; text: string };

type Playbook = {
  id: string; title: string; mapId: string; side: Side; rotation: 0 | 90 | 180 | 270;
  items: PlaybookItem[]; visiblePhases: Phase[]; background: "minimap" | "callouts" | "heatmap-team" | "heatmap-opponent" | "cluster";
  updatedAt: string;
};
```

Atenção: o repo antigo guarda posições em porcentagem (0..100). Converta para 0..1 ao portar.
