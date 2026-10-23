import { useQuery } from "@tanstack/react-query";
import { q, type PlayerPressure } from "../../../api";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { SectionLabel, Stat } from "../../../design/primitives";
import { diff, fmt, pp, tone } from "../shared";
import styles from "../player.module.css";

type Context = PlayerPressure[number];

const CONTEXT_LABEL: Record<string, { title: string; sub: string }> = {
  advantage: { title: "Em vantagem", sub: "Seu time com mais jogadores vivos." },
  disadvantage: { title: "Em desvantagem", sub: "Seu time com menos jogadores vivos." },
  clutch: { title: "Clutch", sub: "Você sozinho contra um ou mais adversários." },
  eco_vs_full_buy: { title: "Eco contra compra cheia", sub: "Seu time economizando, o adversário comprado." },
  losing_streak: { title: "Sequência de derrotas", sub: "Depois de perder três rounds seguidos ou mais." },
  low_clock: { title: "Pouco tempo", sub: "Últimos 20 segundos do round." },
  match_point: { title: "Match point", sub: "Rounds em que um dos times fecha a partida." },
  post_plant: { title: "Pós-plant", sub: "Depois que a spike foi plantada." },
};

const labelOf = (c: string) => CONTEXT_LABEL[c] ?? { title: c, sub: "" };

/** Maior diferença de vitória contra a média, para cima e para baixo. */
function insightFor(list: Context[]): string {
  const sorted = [...list].sort((a, b) => b.winRate - b.baseline.winRate - (a.winRate - a.baseline.winRate));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (!best || !worst) return "Ainda não há rounds suficientes para ler a pressão.";
  const d = (c: Context) => fmt(Math.abs(c.winRate - c.baseline.winRate) * 100, 0);
  const parts: string[] = [];
  if (best.winRate - best.baseline.winRate >= 0.03) parts.push(`Você cresce em ${labelOf(best.context).title.toLowerCase()}: vence ${d(best)} p.p. acima da média`);
  if (worst !== best && worst.baseline.winRate - worst.winRate >= 0.03) parts.push(`em ${labelOf(worst.context).title.toLowerCase()}, fica ${d(worst)} p.p. abaixo`);
  return parts.length ? `${parts.join("; ")}.` : "Nos momentos de pressão, você joga perto da média do campeonato.";
}

export default function PressaoPage() {
  const me = useMe();
  const playerId = me.player?.id;
  const pressure = useQuery({ ...q.players.pressure(playerId ?? 0), enabled: playerId != null });

  if (playerId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um jogador. Peça ao admin para vincular.</p>;
  if (pressure.error) return <p className={styles.state}>{pressure.error.message}</p>;
  if (pressure.isPending) return <p className={styles.state}>Carregando os momentos de pressão.</p>;

  const list = pressure.data;

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <SectionLabel index={1}>Sob pressão</SectionLabel>
        <p className={styles.insight}>{insightFor(list)}</p>
        <p className={styles.help}>Cada cartão compara você com a média de todos os jogadores do campeonato na mesma situação.</p>
      </section>
      <section className={styles.section}>
        <SectionLabel index={2}>Por situação</SectionLabel>
        <div className={styles.grid}>
          {list.map((c) => {
            const l = labelOf(c.context);
            const low = c.playerRounds < 20;
            return (
              <article key={c.context} className={cx(styles.panel, "st-cut", low && styles.low)}>
                <div>
                  <h3 className={styles.title}>{l.title}</h3>
                  <p className={styles.sub}>
                    {l.sub} {c.playerRounds} rounds.
                  </p>
                </div>
                <div className={styles.stats}>
                  <Stat
                    label="Vitória"
                    value={fmt(c.winRate * 100)}
                    unit="%"
                    delta={pp(c.winRate, c.baseline.winRate)}
                    deltaTone={tone(c.winRate, c.baseline.winRate, 0.03)}
                    comparison="contra a média"
                  />
                  <Stat
                    label="Sobrevivência"
                    value={fmt(c.survivalRate * 100)}
                    unit="%"
                    delta={pp(c.survivalRate, c.baseline.survivalRate)}
                    deltaTone={tone(c.survivalRate, c.baseline.survivalRate, 0.03)}
                    comparison="contra a média"
                  />
                  <Stat label="K/D" value={fmt(c.kd, 2)} delta={diff(c.kd, c.baseline.kd)} deltaTone={tone(c.kd, c.baseline.kd, 0.1)} comparison="contra a média" />
                </div>
                {low ? <p className={styles.help}>Amostra pequena: menos de 20 rounds.</p> : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
