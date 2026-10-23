import type { CSSProperties } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { q, type Insight, type MapStats, type TeamDetail, type TeamEconomy } from "../../../api";
import { useTeamScope } from "../../../app/teamScope";
import { navigate } from "../../../app/router";
import { pranchetaLink } from "../pranchetaLink";
import { estimateHelp } from "../../../copy/estimates";
import { cx } from "../../../design/cx";
import { Badge, Button, Icon, SectionLabel, Stat } from "../../../design/primitives";
import { assetUrl, MAPS as FRONT_MAPS } from "../../../map/mapData";
import styles from "./MeuTimePage.module.css";

// Coach, Meu time. Protótipo em docs/prototipo/CoachTime.dc.html.
// Panorama do time, win rate por mapa e lado (comparado à média do campeonato) e os principais alertas.

type TeamMap = TeamDetail["maps"][number];

/** Abaixo disso a taxa do mapa fica esmaecida: pouca partida para uma leitura confiável. */
const MIN_MATCHES = 5;
const MAX_ALERTS = 3;

const pct = (rate: number) => Math.round(rate * 100);
const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Diferença em pontos percentuais, sempre com sinal ("+7 p.p.", "-3 p.p."). */
function deltaPp(rate: number, base: number) {
  const d = pct(rate) - pct(base);
  return `${d > 0 ? "+" : d < 0 ? "-" : ""}${Math.abs(d)} p.p.`;
}

const KIND_LABEL: Record<Insight["kind"], string> = {
  repetitive_pattern: "Padrão",
  economy: "Economia",
  pressure: "Pressão",
  rotation: "Rotação",
  ability_estimate: "Habilidades",
  combo: "Combo",
  strategy: "Estratégia",
  agent: "Agente",
  map: "Mapa",
  summary: "Resumo",
};


/** Média ponderada por partidas: o mapa mais jogado pesa mais na taxa geral do time. */
function teamSideRates(maps: TeamMap[]) {
  const total = maps.reduce((s, m) => s + m.matches, 0) || 1;
  return {
    attack: maps.reduce((s, m) => s + m.attackRoundWinRate * m.matches, 0) / total,
    defense: maps.reduce((s, m) => s + m.defenseRoundWinRate * m.matches, 0) / total,
  };
}

/** Média do campeonato nos mesmos mapas que o time jogou, com o mesmo peso por partidas do time. */
function championshipSideRates(maps: TeamMap[], stats: Array<MapStats | undefined>) {
  let weight = 0;
  let attack = 0;
  let defense = 0;
  maps.forEach((m, i) => {
    const s = stats[i];
    if (!s) return;
    const atk = s.sides.find((x) => x.side === "attack")?.roundWinRate;
    const def = s.sides.find((x) => x.side === "defense")?.roundWinRate;
    if (atk == null || def == null) return;
    weight += m.matches;
    attack += atk * m.matches;
    defense += def * m.matches;
  });
  return weight ? { attack: attack / weight, defense: defense / weight } : null;
}

/** Win rate da compra completa e o esperado pela compra do adversário nesses mesmos rounds. */
function fullBuy(economy: TeamEconomy) {
  const row = economy.byBuyType.find((b) => b.buyType === "full_buy");
  const cells = economy.matrix.filter((c) => c.buyType === "full_buy");
  const rounds = cells.reduce((s, c) => s + c.rounds, 0);
  if (!row || !rounds) return null;
  return { winRate: row.winRate, rounds: row.rounds, expected: cells.reduce((s, c) => s + c.expectedWinRate * c.rounds, 0) / rounds };
}

/** Frase-resumo antes dos números: o resultado geral e o ponto mais fraco com amostra confiável. */
function headline(team: TeamDetail) {
  const base = `O time vence ${Math.round(team.winRate * 10)} de cada 10 partidas.`;
  const cells = team.maps
    .filter((m) => m.matches >= MIN_MATCHES)
    .flatMap((m) => [
      { map: m.map.name, side: "o ataque", rate: m.attackRoundWinRate },
      { map: m.map.name, side: "a defesa", rate: m.defenseRoundWinRate },
    ]);
  const worst = [...cells].sort((a, b) => a.rate - b.rate)[0];
  if (!worst || worst.rate >= 0.5) return base;
  return `${base} O ponto mais fraco é ${worst.side} na ${worst.map}: ${pct(worst.rate)}% dos rounds vencidos.`;
}

/** Cor mais forte quanto mais longe de 50%: vermelho abaixo, ciano acima. */
function cellStyle(rate: number): CSSProperties {
  const dist = Math.min(1, Math.abs(rate - 0.5) / 0.25);
  const color = rate >= 0.5 ? "var(--cyan)" : "var(--signal)";
  return { background: `color-mix(in srgb, ${color} ${Math.round(25 + dist * 60)}%, var(--ink-800))` };
}

const bannerFor = (name: string) => {
  const front = FRONT_MAPS.find((m) => m.name.toLowerCase() === name.toLowerCase());
  return front ? assetUrl(front.banner) : undefined;
};

export default function MeuTimePage() {
  const teamId = useTeamScope()?.id;

  const team = useQuery({ ...q.teams.get(teamId ?? 0), enabled: teamId != null });
  const economy = useQuery({ ...q.teams.economy(teamId ?? 0), enabled: teamId != null });
  const insights = useQuery({ ...q.insights({ scope: "team", id: teamId ?? 0 }), enabled: teamId != null });
  const maps = team.data?.maps ?? [];
  // Sem filtro de time: é a média de todos os times do campeonato em cada mapa
  const mapStats = useQueries({ queries: maps.map((m) => q.maps.stats(m.map.id)) });

  if (teamId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um time.</p>;
  if (team.error) return <p className={styles.state}>{team.error.message}</p>;
  if (team.isPending) return <p className={styles.state}>Carregando o time.</p>;

  const t = team.data;
  const sides = teamSideRates(t.maps);
  const avg = championshipSideRates(
    t.maps,
    mapStats.map((s) => s.data),
  );
  const buy = economy.data ? fullBuy(economy.data) : null;
  const alerts = (insights.data ?? [])
    .filter((i) => i.polarity === "negative")
    .sort((a, b) => b.severity - a.severity)
    .slice(0, MAX_ALERTS);

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <SectionLabel index={1}>Panorama</SectionLabel>
        <p className={styles.headline}>{headline(t)}</p>
        <div className={cx(styles.panel, styles.stats, "st-cut")}>
          <Stat
            label="Win rate"
            help="Win rate: porcentagem de partidas vencidas."
            value={String(pct(t.winRate))}
            unit="%"
            comparison={`${t.wins} vitórias em ${t.matches} partidas`}
          />
          <Stat
            label="Rounds de ataque"
            help="Porcentagem dos rounds de ataque que o time venceu, somando todos os mapas."
            value={String(pct(sides.attack))}
            unit="%"
            delta={avg ? deltaPp(sides.attack, avg.attack) : undefined}
            comparison={avg ? "contra a média do campeonato" : undefined}
          />
          <Stat
            label="Rounds de defesa"
            help="Porcentagem dos rounds de defesa que o time venceu, somando todos os mapas."
            value={String(pct(sides.defense))}
            unit="%"
            delta={avg ? deltaPp(sides.defense, avg.defense) : undefined}
            comparison={avg ? "contra a média do campeonato" : undefined}
          />
          {buy ? (
            <Stat
              label="Compra completa"
              help="Rounds em que o time comprou arma e escudo completos. O esperado leva em conta o que o adversário comprou nesses rounds."
              value={String(pct(buy.winRate))}
              unit="%"
              delta={deltaPp(buy.winRate, buy.expected)}
              comparison={`contra ${pct(buy.expected)}% esperado em ${fmt(buy.rounds)} rounds`}
            />
          ) : economy.error ? (
            <p className={styles.note}>{economy.error.message}</p>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel index={2}>Win rate por mapa e lado</SectionLabel>
        {t.maps.length ? (
          <div className={cx(styles.panel, "st-cut")}>
            <div className={styles.scroll}>
              <div className={styles.matrix} role="table" aria-label="Win rate por mapa e lado">
                <div role="row" className={styles.row}>
                  <span role="columnheader" className={styles.head}>
                    Mapa
                  </span>
                  <span role="columnheader" className={cx(styles.head, styles.attack)}>
                    <Icon name="attack" size={16} />
                    Ataque
                  </span>
                  <span role="columnheader" className={cx(styles.head, styles.defense)}>
                    <Icon name="defense" size={16} />
                    Defesa
                  </span>
                  <span role="columnheader" className={styles.head}>
                    Partidas
                  </span>
                  <span role="columnheader" className={cx(styles.head, styles.right)}>
                    Amostra
                  </span>
                </div>
                {[...t.maps]
                  .sort((a, b) => b.matches - a.matches)
                  .map((m) => {
                    const low = m.matches < MIN_MATCHES;
                    const banner = bannerFor(m.map.name);
                    const matchRate = m.matches ? m.wins / m.matches : 0;
                    return (
                      <div role="row" key={m.map.id} className={cx(styles.row, low && styles.low)}>
                        <span role="rowheader" className={styles.mapName}>
                          {banner ? <img src={banner} alt="" className={styles.banner} /> : null}
                          <span>{m.map.name}</span>
                        </span>
                        <span role="cell" className={styles.cell} style={cellStyle(m.attackRoundWinRate)}>
                          {pct(m.attackRoundWinRate)}%
                        </span>
                        <span role="cell" className={styles.cell} style={cellStyle(m.defenseRoundWinRate)}>
                          {pct(m.defenseRoundWinRate)}%
                        </span>
                        <span role="cell" className={styles.cell} style={cellStyle(matchRate)}>
                          {pct(matchRate)}%
                        </span>
                        <span role="cell" className={styles.sample}>
                          {m.matches} {m.matches === 1 ? "partida" : "partidas"}
                          {low ? " (pouco)" : ""}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
            <p className={styles.note}>
              Ataque e defesa mostram os rounds vencidos; partidas mostra as vitórias no mapa. Cor mais forte quer dizer taxa mais
              distante de 50%: vermelho abaixo, ciano acima. Mapas com menos de {MIN_MATCHES} partidas ficam esmaecidos.
            </p>
          </div>
        ) : (
          <p className={styles.state}>O time ainda não tem partidas registradas.</p>
        )}
      </section>

      <section className={styles.section}>
        <SectionLabel index={3}>Alertas do time</SectionLabel>
        {insights.error ? (
          <p className={styles.state}>{insights.error.message}</p>
        ) : insights.isPending ? (
          <p className={styles.state}>Carregando alertas.</p>
        ) : alerts.length ? (
          <div className={styles.alerts}>
            {alerts.map((a) => (
              <article key={a.id} className={cx(styles.panel, styles.alert, "st-cut")}>
                <div className={styles.badges}>
                  <Badge tone="alert" icon="alert">
                    {KIND_LABEL[a.kind]}
                  </Badge>
                  {a.isEstimate ? <Badge tone="estimate">Estimativa</Badge> : null}
                </div>
                <h3 className={styles.alertTitle}>{a.title}</h3>
                <p className={styles.alertBody}>{a.body}</p>
                <p className={styles.note}>{a.isEstimate ? estimateHelp(a.kind) : `Leitura feita a partir de ${fmt(a.sampleSize)} casos.`}</p>
                {a.map ? (
                  <Button size="sm" className={styles.alertAction} onClick={() => a.map && navigate(pranchetaLink({ map: a.map, side: a.side, title: a.title }))}>
                    Abrir na prancheta
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.state}>Nenhum alerta no momento. O time não tem padrão negativo recorrente nas partidas analisadas.</p>
        )}
      </section>
    </div>
  );
}
