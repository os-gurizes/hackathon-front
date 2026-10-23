import type { Insight } from "../api";

// Por que um número é estimativa, conforme o tipo de leitura: o spec pede que o selo
// "Estimativa" venha com uma explicação de verdade, não com um texto genérico.
const HELP: Partial<Record<Insight["kind"], string>> = {
  ability_estimate: "O jogo não registra quando cada habilidade foi usada. Este número é calculado a partir de abates e assistências.",
  combo: "O jogo não registra quando cada habilidade foi usada. A combinação é deduzida dos abates e assistências feitos juntos.",
  rotation:
    "O jogo não registra o caminho de cada jogador. A rotação é deduzida das posições guardadas a cada abate, plant e defuse.",
  pressure: "O jogo não registra o tempo de cada decisão. O contexto de pressão é deduzido do placar, do relógio e de quem estava vivo.",
  strategy: "O jogo não registra a estratégia chamada. Ela é deduzida das posições do time no começo de cada round.",
};

const DEFAULT_HELP = "Este número é calculado de forma indireta, a partir de abates e posições, e não de um registro direto do jogo.";

export const estimateHelp = (kind: Insight["kind"]) => HELP[kind] ?? DEFAULT_HELP;
