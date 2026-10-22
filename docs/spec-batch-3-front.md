# Batch 3: Front-end

Aplicação React que transforma os dados da API (Batch 2) em leitura simples para jogadores e coaches, com identidade visual própria e um aceno ao universo tático do Valorant.

## Regras do batch

- React com TypeScript.
- **Sem AI slop**:
  - sem travessões nos textos da interface;
  - sem emojis;
  - sem Lucide;
  - sem shadcn/ui;
  - sem gradientes roxos, glassmorphism, cards genéricos com sombra borrada ou hero de landing page.
- No lugar de emojis, ícones de um set próprio em SVG (seção 4).
- Visual limpo e elegante, com identidade forte.
- UX pensada para quem não é técnico: linguagem simples, todo número com contexto, e nenhuma sigla sem explicação.
- Visões distintas para player e coach, com abas próprias.

## 1. Stack

| Camada | Escolha |
|---|---|
| Build | Vite |
| UI | React 19 com TypeScript strict |
| Rotas | TanStack Router (rotas tipadas e guardas por papel) |
| Dados | TanStack Query com cliente gerado a partir do `openapi.json` (`openapi-typescript` e `openapi-fetch`) |
| Estilo | CSS Modules com design tokens em CSS custom properties. Sem framework de UI |
| Gráficos | `d3-scale`, `d3-shape` e `d3-contour` com componentes próprios em SVG |
| Heatmap | Canvas 2D próprio (desfoque gaussiano ajustável e paleta da identidade) |
| Prancheta do coach | `react-konva` |
| Fontes | self-hosted via `@fontsource`, sem CDN em runtime |
| Testes | Vitest com Testing Library; Playwright para os fluxos principais |

## 2. Identidade visual

### Conceito
"Sala tática": uma interface que parece um briefing de operação. Ela é escura e contida, com um vermelho de alerta usado com parcimônia e geometria angular.

A referência ao Valorant está em três detalhes:
- os cortes diagonais nos cantos;
- o vermelho característico;
- a tipografia condensada em caixa alta nos títulos.

Não usamos logo, arte, fonte proprietária ou imagem do jogo.

### Paleta
| Token | Valor | Uso |
|---|---|---|
| `--ink-900` | `#0F1923` | fundo principal |
| `--ink-800` | `#16222E` | superfícies |
| `--ink-700` | `#1F2D3A` | superfícies elevadas e bordas fortes |
| `--line` | `#2C3B49` | divisórias de 1 px |
| `--bone` | `#ECE8E1` | texto principal |
| `--bone-muted` | `#9AA3AD` | texto secundário |
| `--signal` | `#FF4655` | destaque, alerta e lado de ataque |
| `--cyan` | `#3CC8C8` | lado de defesa e informação |
| `--gold` | `#E8B04B` | conquista e melhor desempenho |
| `--ok` | `#5FC48A` | positivo |

- O heatmap usa uma escala sequencial de `--ink-800` até `--signal`, passando por um laranja dessaturado. Mortes, kills e K/D têm a escala própria documentada no Storybook de tokens.
- Existe também um tema claro, em papel de briefing (`#ECE8E1` de fundo e `#0F1923` de texto), com o mesmo vermelho, para relatórios impressos e projetor.

### Tipografia
- **Títulos**: `Barlow Condensed` 600 e 700, caixa alta, com tracking de +0,04em.
- **Texto**: `Barlow` 400 e 500.
- **Números**: `Barlow` com `font-variant-numeric: tabular-nums`. Os números grandes de KPI usam `Barlow Condensed` 700.

### Linguagem gráfica
- Cartões e botões com um canto cortado em 45 graus via `clip-path`, de 8 px, sempre no mesmo canto (superior direito).
- Linhas finas de 1 px como réguas de seção, com um pequeno marcador quadrado vermelho no início.
- Rótulos de seção numerados ("01 Visão geral"), como em um dossiê.
- O movimento é curto e funcional (120 a 180 ms, `ease-out`), sem bounce e sem animação decorativa.
- Sem sombras. A hierarquia vem de superfície, borda e contraste.

## 3. Regras de texto (anti-slop)

- Proibido: travessão (em dash e en dash), emoji, exclamação em excesso e frases genéricas como "Desbloqueie seu potencial".
- Um teste automatizado varre os arquivos de texto e de i18n e falha se encontrar `\u2014`, `\u2013` ou caracteres na faixa de emoji.
- Os textos são curtos e diretos, em segunda pessoa. Por exemplo: "Você vence 62% dos rounds em que compra completo."
- Toda sigla tem tooltip na primeira aparição de cada tela: "K/D: abates por morte. Acima de 1,0 significa que você abate mais do que morre."
- Todo número vem com comparação: contra a média do mapa, contra o próprio histórico ou contra o time.
- Os valores estimados levam o selo "Estimativa", com um texto de ajuda que explica por quê: "O jogo não registra quando cada habilidade foi usada. Este número é calculado a partir de abates e assistências."

## 4. Ícones

Um set próprio de cerca de 30 ícones SVG, desenhados para a identidade:
- grid de 24 px e traço de 1,5 px;
- terminações retas e cantos cortados em 45 graus, coerentes com os cartões;
- exportados como componentes React a partir de `src/icons/*.svg` (via `vite-plugin-svgr`), com `currentColor`.

Lista inicial:
- Conceitos de jogo: mira, caveira (morte), alvo (kill), spike, defuse, escudo, moeda (economia), relógio, rota, zona, heatmap, ataque, defesa e clutch.
- Interface: alerta, tendência de alta, tendência de baixa, filtro, mapa, jogador, time, troféu, prancheta, lápis, borracha, seta, camada, salvar, compartilhar, play e pausa.

Se o prazo apertar, o fallback aceito é **Phosphor Icons** no peso `regular`, encapsulado no mesmo componente `<Icon name>` para a troca ser transparente.

## 5. Arquitetura

```
web/
  src/
    app/                 router, providers e guardas por papel
    api/                 cliente gerado e hooks de query por domínio
    design/
      tokens.css
      primitives/        Button, Card, Tabs, Select, Tooltip, Badge, Stat, Table, Drawer
    icons/
    charts/              Bar, Line, WinMatrix, Distribution, Sparkline
    map/                 MapCanvas (silhueta, zonas, heatmap e camadas), ReplayLayer, DrawLayer
    features/
      auth/
      player/            telas da visão player
      coach/             telas da visão coach
      shared/            partidas, rankings e perfis públicos
    copy/                textos e glossário em pt-BR
```

O componente `MapCanvas` é a peça central:
- desenha a silhueta SVG do mapa vinda de `GET /maps`;
- tem camadas plugáveis: zonas, heatmap, kills, replay e desenho;
- todas as camadas compartilham o espaço normalizado 0..1;
- tem zoom e pan.

## 6. Visões e abas

O papel vem de `GET /me`. Depois do login, o player cai em "Meu desempenho" e o coach em "Meu time". O coach pode abrir qualquer jogador do elenco na visão de player, em modo de leitura.

### Visão do player

| Aba | Conteúdo | Itens atendidos |
|---|---|---|
| **Meu desempenho** | KPIs (K/D médio por partida, ACS, ADR, KAST e HS%) comparados ao meu histórico e à média; evolução por campeonato; 3 insights principais | o padrão |
| **Meus mapas** | heatmap pessoal com o seletor presença, abates, mortes e K/D por local; filtro de lado e agente; ao clicar numa zona, o resumo dela e os rounds de exemplo | heatmap |
| **Meus padrões** | cartões de comportamentos repetitivos que pioram o desempenho, ordenados por impacto, cada um com "o que acontece", "quanto custa" e "rounds de exemplo" | comportamentos repetitivos |
| **Sob pressão** | como eu jogo em desvantagem, em clutch, no pós-plant e com o relógio curto; decisões de clutch | tendências sob pressão |
| **Armas** | as armas que mais uso e o meu desempenho por distância, comparado à média | armas |
| **Agentes** | desempenho por agente e mapa; as habilidades que mais geram abates; uso de habilidade sem necessidade (estimativa) | agentes, skills sem necessidade |
| **Economia** | meu loadout médio, rounds com saldo alto parado e compras fora do time | economia |
| **Partidas** | histórico e detalhe da partida (scoreboard e timeline) | geral |

### Visão do coach

| Aba | Conteúdo | Itens atendidos |
|---|---|---|
| **Meu time** | panorama: win rate por mapa e lado, forma recente e os principais alertas do time | o padrão |
| **Análise de partida** | timeline de rounds com curva de win probability; replay 2D de cada round (snapshots em ordem, kills, plant e defuse) sobre a silhueta do mapa | visão de coach |
| **Prancheta** | desenho sobre o mapa com camadas por fase (setup, execução, pós-plant, retake); marcadores de agente, setas, áreas e texto; heatmap ou cluster de estratégia como fundo opcional; salvar, duplicar e compartilhar com o elenco | visão de coach, montar estratégias |
| **Estratégias** | setups detectados com taxa de sucesso, os de maior e menor sucesso, por mapa e lado; botão "Abrir na prancheta" | estratégias |
| **Elenco** | comparação lado a lado dos jogadores e os padrões de cada um | comportamentos repetitivos |
| **Pressão e rotações** | rotações sem informação (mapa com setas de origem e destino e o resultado) e desempenho do time em contextos de pressão | tendências sob pressão |
| **Combos** | pares de jogadores e de agentes que mais geram abates e domínio de bomb (estimativa) | habilidades combadas |
| **Economia do time** | economia média, matriz de vitória por tipo de compra e tendências prejudiciais com o custo em rounds | economia, tendências econômicas |
| **Scouting** | as mesmas leituras para um time adversário: mapas, estratégias, heatmap e economia | geral |
| **Heatmap** | heatmap do time e do adversário com filtros completos | heatmap |

## 7. UX para não técnicos

- **Primeiro acesso guiado**: 3 passos curtos explicando as abas. O tour pode ser pulado e reaberto pelo menu.
- **Glossário** acessível em todas as telas, com as métricas explicadas em uma frase.
- **Insight antes do gráfico**: cada tela abre com a frase-resumo, e o gráfico vem como evidência.
- **Filtros persistentes** no topo (campeonato, mapa, lado), com o estado na URL para que um link possa ser compartilhado.
- **Estados vazios** úteis, como "Poucas partidas neste mapa para uma leitura confiável (3 de 5 necessárias)".
- **Amostra pequena** sinalizada de forma visível; a métrica fica esmaecida abaixo do mínimo.
- **Responsivo**: as abas de leitura funcionam no celular. A prancheta e o replay são otimizados para desktop e tablet.
- **Acessibilidade**:
  - contraste AA nos dois temas;
  - foco visível com o recorte angular;
  - navegação por teclado nas abas e nos filtros;
  - o heatmap tem alternativa em tabela de zonas;
  - as cores de ataque e defesa nunca são a única pista, porque também levam ícone e rótulo.
c
## 8. Prancheta do coach (detalhe)

- **Ferramentas**: caneta livre, seta, área, marcador de agente, texto, borracha, desfazer e refazer (pilha de comandos) e limpar a camada.
- **Camadas por fase**, com visibilidade alternável e uma animação simples que percorre as fases em sequência para apresentar ao time.
- **Fundos**: só a silhueta, a silhueta com zonas, o heatmap do time ou do adversário, ou o cluster de estratégia detectado.
- **Salvamento automático** com debounce de 1,5 s via `PUT /playbook/:id`, com indicador "Salvo" discreto.
- **Exportação em PNG** pelo próprio canvas.
- Os jogadores veem as estratégias compartilhadas em modo de leitura, dentro de "Meus mapas".

## 9. Qualidade

- Testes de componentes: primitives, MapCanvas (transformação de coordenadas) e guardas de rota por papel.
- Playwright:
  - login como player, conferindo o acesso só às abas de player;
  - login como coach, criando uma estratégia, recarregando a página e conferindo que ela persiste;
  - abrir um heatmap, filtrar e conferir que a URL reflete os filtros.
- Teste anti-slop de texto (seção 3) no CI.
- Orçamento: bundle inicial abaixo de 250 KB gzip, com a prancheta e o replay carregados sob demanda.

## 10. Entregáveis e critérios de aceite

| # | Entrega | Aceite |
|---|---|---|
| 1 | Tokens, tipografia, ícones e primitives | página de referência visual com todos os componentes nos dois temas |
| 2 | Auth, guardas e layout com abas por papel | player e coach veem navegações diferentes |
| 3 | MapCanvas com silhueta, zonas e heatmap | os 10 mapas renderizam e os filtros funcionam |
| 4 | Abas do player | todas as abas da seção 6 com dados reais |
| 5 | Análise de partida e replay 2D | o replay percorre os snapshots de um round |
| 6 | Prancheta | CRUD com camadas, autosave e PNG |
| 7 | Demais abas do coach | estratégias, pressão, combos, economia e scouting |
| 8 | Polimento | anti-slop, acessibilidade AA e bundle dentro do orçamento |

## 11. Dependências

- Do Batch 2: o `openapi.json` publicado ao fim da entrega 3 da API. Até lá, o front trabalha com mocks gerados do mesmo contrato (MSW).
- As entregas 1 e 2 deste batch podem começar em paralelo com o Batch 1.
