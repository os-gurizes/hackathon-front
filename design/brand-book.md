Sala Tática é a identidade do front-end de análise de partidas de Valorant (Batch 3): uma interface que parece um briefing de operação. Escura e contida, com um vermelho de alerta usado com parcimônia e geometria angular. Ela transforma os dados da API em leitura simples para jogadores e coaches que não são técnicos.

A identidade visual é própria: cortes diagonais nos cantos, o vermelho de alerta e a tipografia condensada em caixa alta nos títulos. Assets do jogo (minimapas, ícones de agentes e habilidades, banners de mapa, elos) entram como conteúdo, vindos do pacote `assets-valorant` (política Legal Jibber Jabber da Riot: uso gratuito e não comercial, com o aviso da Riot no rodapé). Nunca use o logo do Valorant nem fonte proprietária. O sistema não tem logo: o nome é sempre composto em `title-xl`.

## Texto e voz

- Escreva curto e direto, em segunda pessoa: "Você vence 62% dos rounds em que compra completo."
- Proibido na interface: travessão (em dash e en dash), emoji, exclamação em excesso e frases genéricas como "Desbloqueie seu potencial". Um teste no CI falha se encontrar U+2014, U+2013 ou caracteres da faixa de emoji nos arquivos de texto e i18n.
- Toda sigla tem `Tooltip` na primeira aparição de cada tela: "K/D: abates por morte. Acima de 1,0 significa que você abate mais do que morre."
- Todo número vem com comparação: contra a média do mapa, contra o próprio histórico ou contra o time. Sem comparação, não mostre o número.
- Valores calculados indiretamente levam `Badge tone="estimate"` e um texto de ajuda que explica por quê: "O jogo não registra quando cada habilidade foi usada. Este número é calculado a partir de abates e assistências."
- Insight antes do gráfico: cada tela abre com a frase-resumo em `insight`, e o gráfico vem como evidência.
- Números em pt-BR: vírgula decimal ("1,24"), pontos percentuais como "p.p.".
- Estados vazios explicam o que falta: "Poucas partidas neste mapa para uma leitura confiável (3 de 5 necessárias)."

## Cor

- Fundo da aplicação em `ink-900`; cartões, abas e drawer em `ink-800`; elementos elevados (botão secundário, tooltip, linha destacada) em `ink-700`.
- Texto principal em `bone`, secundário em `bone-muted`. Os dois passam AA sobre os três `ink` nos dois temas.
- `signal` é o vermelho de alerta: botão primário, marcador de seção, aba ativa, lado de ataque, topo do heatmap. No máximo um preenchimento grande em `signal` por tela. Texto sobre `signal` é `on-signal`, nunca branco.
- Vermelho como texto ou ícone usa `signal-text`; no tema claro ele é escurecido para passar 4.5:1.
- `cyan` marca defesa e informação, `gold` conquista e melhor desempenho, `ok` o que é positivo.
- Ataque e defesa nunca dependem só da cor: levam ícone (`attack`, `defense`) e rótulo.
- Divisórias de 1 px em `line`. Bordas de controle (select, contorno de estimativa, cabeçalho de tabela) em `line-strong`, que passa 3:1.
- Heatmap: escala sequencial `heat-0` a `heat-5`, de `ink-800` até `signal`, passando por um laranja dessaturado. Nunca use a escala como decoração. As escalas próprias de mortes, kills e K/D ainda não estão definidas aqui.

### Temas

- `dark` (Sala tática) é o padrão da aplicação.
- `light` (Briefing) é papel de briefing (`#ECE8E1` de fundo, `#0F1923` de texto) para relatórios impressos e projetor. Mantém o mesmo `signal` em preenchimentos; `signal-text`, `cyan`, `gold`, `ok` e `bone-muted` são escurecidos para AA.

## Tipografia

- Títulos em Barlow Condensed 600 e 700, caixa alta, tracking de +0,04em: `title-xl` (tela), `title-lg` (seção grande, drawer), `title-md` (cartão).
- `label` (Barlow Condensed 600, 13 px, +0,08em) para rótulos de seção, cabeçalhos de tabela, abas, badges e botões.
- Texto em Barlow 400 e 500: `insight` para a frase-resumo, `body` e `body-strong` para leitura, `caption` para comparações e notas.
- Números: `kpi` e `kpi-sm` em Barlow Condensed 700. Todo número usa `font-variant-numeric: tabular-nums`.
- Fontes self-hosted (os arquivos em `fonts/` vêm do `@fontsource`, subset latin). Nada de CDN em runtime.

## Forma e espaço

- Cartões, botões, select e drawer têm um canto cortado em 45 graus de `cut-corner` (8 px), sempre o superior direito, via `clip-path` (classe `.st-cut`).
- Nenhum canto arredondado (`radius-none`) e nenhuma sombra. A hierarquia vem de superfície, borda e contraste.
- Rótulos de seção numerados como em um dossiê, com `SectionLabel`: quadrado em `signal`, "01 Visão geral" e régua de 1 px em `line`.
- Espaçamento em passos de 4 px: `space-2` entre rótulo e valor, `space-6` de padding de cartão e entre cartões, `space-8` antes de cada seção, `space-12` entre blocos de tela.
- Proibido: gradientes roxos, glassmorphism, cartões genéricos com sombra borrada, faixa colorida na lateral de cartão e hero de landing page.

## Movimento

- Curto e funcional: 120 a 180 ms, `ease-out`. Sem bounce e sem animação decorativa.
- Respeite `prefers-reduced-motion`: transições e entrada do drawer desligam.

## Foco e acessibilidade

- Foco visível em `focus`, 2 px (`border-focus`), desenhado por dentro do recorte para não ser cortado pelo `clip-path`. Passa 3:1 sobre todas as superfícies nos dois temas.
- Contraste AA nos dois temas; navegação por teclado nas abas (setas, Home, End) e nos filtros.
- O heatmap sempre tem alternativa em `Table` de zonas.
- Amostra pequena é visível: abaixo do mínimo, o `Stat` esmaece o valor e diz quantas partidas faltam.

## Iconografia

- Set próprio de 33 ícones em `assets/Icones`, desenhados para esta identidade: grid de 24 px, traço de 1.5 px (`stroke-icon`), terminações retas, cantos cortados em 45 graus.
- Na interface, use o componente `Icon` (cor por `currentColor`). Os SVGs do grupo são referência, com tinta fixa em `#9AA3AD`.
- Ícones no lugar de emoji, sempre. Sem Lucide e sem shadcn/ui.
- Fallback aceito se o prazo apertar: Phosphor Icons no peso regular, encapsulado no mesmo `<Icon name>`.

## Componentes

`components/bundle.js` define `window.SalaTatica` e espera React no global. Primitives: `Button`, `Card`, `Tabs`, `Select`, `Tooltip`, `Badge`, `Stat`, `Table`, `Drawer`, mais `Icon` e `SectionLabel`. Gráficos (`charts/`), `MapCanvas`, replay e prancheta ficam fora deste sistema por enquanto; eles consomem os mesmos tokens.
