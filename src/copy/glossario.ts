// Glossário: cada métrica explicada em uma frase, em linguagem de quem não é técnico (spec, seção 7).

export type Termo = { termo: string; nome: string; explicacao: string };

export const GLOSSARIO: Termo[] = [
  { termo: "K/D", nome: "Abates por morte", explicacao: "Quantos abates você faz para cada vez que morre. Acima de 1,0, você abate mais do que morre." },
  { termo: "ACS", nome: "Pontuação média de combate", explicacao: "Nota do jogo por round que soma dano, abates e assistências. Quanto maior, mais você participou das trocas." },
  { termo: "ADR", nome: "Dano médio por round", explicacao: "Quanto dano você causa, em média, a cada round. Mostra impacto mesmo quando o abate fica com outro." },
  { termo: "KAST", nome: "Rounds com participação", explicacao: "Porcentagem de rounds em que você abateu, deu assistência, sobreviveu ou foi trocado. Mede constância." },
  { termo: "HS%", nome: "Taxa de headshot", explicacao: "Porcentagem dos seus acertos que foram na cabeça. Mira mais alta costuma resolver trocas mais rápido." },
  { termo: "Win rate", nome: "Taxa de vitória", explicacao: "Porcentagem de partidas ou rounds vencidos. Abaixo de 50%, o time perde mais do que ganha ali." },
  { termo: "p.p.", nome: "Pontos percentuais", explicacao: "Diferença entre duas porcentagens. Ir de 50% para 55% é subir 5 p.p." },
  { termo: "Trade", nome: "Troca", explicacao: "Quando um aliado abate, logo em seguida, quem acabou de matar alguém do time. Morrer sem trade é morrer sozinho." },
  { termo: "Primeiro abate", nome: "Abertura do round", explicacao: "O primeiro abate do round. Quem abre o round coloca o time em vantagem de cinco contra quatro." },
  { termo: "Clutch", nome: "Situação de último vivo", explicacao: "Quando só você está vivo no time e precisa vencer o round contra um ou mais adversários." },
  { termo: "Pistol", nome: "Round de pistola", explicacao: "Primeiro round de cada metade, em que todos começam só com pistola e pouco dinheiro." },
  { termo: "Eco", nome: "Round econômico", explicacao: "Round em que o time quase não compra para juntar dinheiro e comprar completo no seguinte." },
  { termo: "Compra completa", nome: "Full buy", explicacao: "Round com armas principais e escudo para todo o time. É quando se espera a maior chance de vitória." },
  { termo: "Pós-plant", nome: "Depois da spike plantada", explicacao: "Parte do round depois que o ataque planta a spike: a defesa precisa desarmar e o ataque, proteger." },
  { termo: "Retake", nome: "Retomada do site", explicacao: "Quando a defesa volta para recuperar o site em que a spike foi plantada." },
  { termo: "Rotação", nome: "Troca de site", explicacao: "Quando defensores saem de um site para ajudar no outro. Rodar sem informação deixa o primeiro site aberto." },
  { termo: "Heatmap", nome: "Mapa de calor", explicacao: "Mapa colorido com onde algo acontece mais: quanto mais quente a cor, mais vezes naquele ponto." },
  {
    termo: "Estimativa",
    nome: "Número calculado de forma indireta",
    explicacao: "O jogo não registra tudo, como o momento de cada habilidade. Esses números são deduzidos de abates e posições.",
  },
  {
    termo: "Amostra pequena",
    nome: "Poucos dados",
    explicacao: "Com poucas partidas ou rounds, o número pode ser sorte ou azar. Fica esmaecido até ter dados suficientes.",
  },
];

/** Busca sem acento, sem diferença de maiúsculas e com hífen valendo espaço, no termo, no nome e na explicação. */
export function buscarTermos(busca: string, termos: Termo[] = GLOSSARIO): Termo[] {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[-_/]/g, " ").toLowerCase();
  const q = norm(busca.trim());
  if (!q) return termos;
  return termos.filter((t) => [t.termo, t.nome, t.explicacao].some((s) => norm(s).includes(q)));
}
