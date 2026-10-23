import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { q, type AnalyticsFilters, type Insight, type PlayerMatches, type PlayerStats } from "../../../api";
import { linkHandler } from "../../../app/router";
import { estimateHelp } from "../../../copy/estimates";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { Badge, SectionLabel, Select, Stat, type BadgeTone } from "../../../design/primitives";
import { AGENTS as FRONT_AGENTS, assetUrl, MAPS as FRONT_MAPS } from "../../../map/mapData";
import styles from "./MeuDesempenhoPage.module.css";

// Player, Meu desempenho. Protótipo em docs/prototipo/PlayerDesempenho.dc.html.
// KPIs com comparação, evolução nas últimas partidas, os insights que mais pesam e os agentes mais jogados.

type Totals = PlayerStats["overall"];
type Match = PlayerMatches["items"][number];
type Side = "attack" | "defense";

/** Abaixo disso o número fica esmaecido: pouca partida para uma leitura confiável. */
const MIN_MATCHES = 5;
const RECENT = 5;
const MAX_INSIGHTS = 3;
const MAX_AGENTS = 3;

const pct = (rate: number) => Math.round(rate * 100);
const fmt = (n: number, digits = 0) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const signed = (n: number, digits = 0) => {
  const r = Number(n.toFixed(digits));
  return `${r > 0 ? "+" : r < 0 ? "-" : ""}${fmt(Math.abs(r), digits)}`;
};
const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);

type Kpi = {
  id: "kd" | "acs" | "adr" | "kast" | "hs";
  label: string;
  help: string;
  get: (t: Totals) => number;
  /** Taxas (0..1) aparecem em % e a diferença em pontos percentuais. */
  rate?: boolean;
  digits?: number;
};

const KPIS: Kpi[] = [
  {
    id: "kd",
    label: "K/D",
    help: "K/D: abates por morte. Acima de 1,0 significa que você abate mais do que morre.",
    get: (t) => t.kd,
    digits: 2,
  },
  {
    id: "acs",
    label: "ACS",
    help: "ACS: pontuação média de combate por round. Soma dano, abates e assistências.",
    get: (t) => t.acs,
  },
  {
    id: "adr",
    label: "ADR",
    help: "ADR: dano médio que você causa por round.",
    get: (t) => t.adr,
  },
  {
    id: "kast",
    label: "KAST",
    help: "KAST: em quantos rounds você abateu, deu assistência, sobreviveu ou foi trocado.",
    get: (t) => t.kast,
    rate: true,
  },
  {
    id: "hs",
    label: "HS%",
    help: "HS%: parte dos seus tiros que acertam a cabeça.",
    get: (t) => t.headshotRate,
    rate: true,
  },
];

const show = (k: Kpi, t: Totals) => (k.rate ? String(pct(k.get(t))) : fmt(k.get(t), k.digits));
const diff = (k: Kpi, now: number, base: number) => (k.rate ? `${signed(pct(now) - pct(base))} p.p.` : signed(now - base, k.digits));

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


const mapBanner = (name: string) => {
  const m = FRONT_MAPS.find((f) => f.name.toLowerCase() === name.toLowerCase());
  return m ? assetUrl(m.banner) : undefined;
};
const agentIcon = (name: string) => {
  const a = FRONT_AGENTS.find((f) => f.name.toLowerCase() === name.toLowerCase());
  return a ? assetUrl(a.icon) : undefined;
};

/** Frase-resumo antes dos números: a fase recente contra a média e quanto você morre primeiro no ataque. */
function headline(overall: Totals, attack: Totals | undefined, recent: Match[]) {
  const parts: string[] = [];
  if (recent.length) {
    const kd = avg(recent.map((m) => m.kd));
    const rel = Math.abs(kd - overall.kd) < 0.03 ? "igual à" : kd > overall.kd ? "acima da" : "abaixo da";
    parts.push(`Nas últimas ${recent.length} partidas seu K/D é ${fmt(kd, 2)}, ${rel} sua média de ${fmt(overall.kd, 2)}.`);
  }
  if (attack && attack.rounds && attack.firstDeaths) {
    parts.push(`Você morre primeiro em 1 de cada ${Math.round(attack.rounds / attack.firstDeaths)} rounds de ataque.`);
  }
  return parts.join(" ") || `Você jogou ${overall.matches} partidas com K/D de ${fmt(overall.kd, 2)}.`;
}

export default function MeuDesempenhoPage() {
  const me = useMe();
  if (me.player == null) return <p className={styles.state}>Sua conta ainda não está ligada a um jogador.</p>;
  return <DesempenhoView playerId={me.player.id} />;
}

/**
 * A tela em si, para qualquer jogador. O coach usa em modo leitura a partir do Elenco:
 * sem os links para Meus mapas, que é uma aba só do player.
 */
export function DesempenhoView({ playerId: id, readOnly = false }: { playerId: number; readOnly?: boolean }) {
  const [mapId, setMapId] = useState("");
  const [side, setSide] = useState<Side | "">("");
  const filtered = mapId !== "" || side !== "";
  const filters: AnalyticsFilters = {
    ...(mapId ? { map: Number(mapId) } : {}),
    ...(side ? { side } : {}),
  };

  const profile = useQuery(q.players.get(id));
  // Sem filtro as duas consultas têm a mesma chave e o TanStack Query faz uma só
  const all = useQuery(q.players.stats(id));
  // Ao trocar o filtro, os números anteriores ficam na tela até os novos chegarem
  const stats = useQuery({
    ...q.players.stats(id, filtered ? filters : undefined),
    placeholderData: keepPreviousData,
  });
  const matches = useQuery(q.players.matches(id));
  const insights = useQuery(q.insights({ scope: "player", id }));

  if (stats.error) return <p className={styles.state}>{stats.error.message}</p>;
  if (stats.isPending) return <p className={styles.state}>Carregando seu desempenho.</p>;

  const s = stats.data;
  const overall = s.overall;
  // A API devolve da mais recente para a mais antiga
  const recent = (matches.data?.items ?? []).slice(0, RECENT);
  const attack = s.bySide.find((b) => b.side === "attack")?.stats;
  const defense = s.bySide.find((b) => b.side === "defense")?.stats;
  const base = profile.data?.totals;

  const comparison = (k: Kpi): { delta?: string; text?: string } => {
    if (filtered && base)
      return {
        delta: diff(k, k.get(overall), k.get(base)),
        text: "contra o seu geral",
      };
    if ((k.id === "kd" || k.id === "acs") && recent.length) {
      const r = avg(recent.map((m) => (k.id === "kd" ? m.kd : m.acs)));
      return {
        delta: diff(k, r, k.get(overall)),
        text: `nas últimas ${recent.length} partidas`,
      };
    }
    if (attack && defense)
      return {
        text: `Ataque ${show(k, attack)}${k.rate ? "%" : ""}, defesa ${show(k, defense)}${k.rate ? "%" : ""}`,
      };
    return {};
  };

  const mapOptions = [
    { value: "", label: "Todos os mapas" },
    ...(all.data?.byMap ?? []).map((m) => ({
      value: String(m.map.id),
      label: `${m.map.name} (${m.stats.matches} partidas)`,
    })),
  ];
  const topInsights = [...(insights.data ?? [])].sort((a, b) => b.severity - a.severity).slice(0, MAX_INSIGHTS);
  const topAgents = [...s.byAgent].sort((a, b) => b.stats.matches - a.stats.matches).slice(0, MAX_AGENTS);

  return (
    <div className={styles.page}>
      <div className={styles.filters}>
        <Select label="Mapa" value={mapId} options={mapOptions} onChange={setMapId} />
        <Select
          label="Lado"
          value={side}
          options={[
            { value: "", label: "Ataque e defesa" },
            { value: "attack", label: "Ataque" },
            { value: "defense", label: "Defesa" },
          ]}
          onChange={(v) => setSide(v as Side | "")}
        />
      </div>

      <section className={styles.section}>
        <SectionLabel index={1}>Visão geral</SectionLabel>
        <p className={styles.headline}>{headline(overall, attack, filtered ? [] : recent)}</p>
        <div className={cx(styles.panel, styles.stats, "st-cut")}>
          {KPIS.map((k) => {
            const c = comparison(k);
            return (
              <Stat
                key={k.id}
                label={k.label}
                help={k.help}
                value={show(k, overall)}
                unit={k.rate ? "%" : undefined}
                delta={c.delta}
                deltaTone={c.delta && /^0([,.]0+)?( |$)/.test(c.delta) ? "neutral" : undefined}
                comparison={c.text}
                sample={overall.matches}
                minSample={MIN_MATCHES}
              />
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel index={2}>Evolução nas últimas partidas</SectionLabel>
        {matches.error ? (
          <p className={styles.state}>{matches.error.message}</p>
        ) : matches.isPending ? (
          <p className={styles.state}>Carregando partidas.</p>
        ) : (
          <EvolutionChart matches={matches.data.items} />
        )}
      </section>

      <section className={styles.section}>
        <SectionLabel index={3}>O que mais pesa agora</SectionLabel>
        {insights.error ? (
          <p className={styles.state}>{insights.error.message}</p>
        ) : insights.isPending ? (
          <p className={styles.state}>Carregando leituras.</p>
        ) : topInsights.length ? (
          <div className={styles.cards}>
            {topInsights.map((i) => (
              <InsightCard key={i.id} insight={i} readOnly={readOnly} />
            ))}
          </div>
        ) : (
          <p className={styles.state}>Ainda não há leituras suficientes. Elas aparecem conforme você joga mais partidas.</p>
        )}
      </section>

      <section className={styles.section}>
        <SectionLabel index={4}>Agentes mais jogados</SectionLabel>
        {topAgents.length ? (
          <div className={styles.agents}>
            {topAgents.map(({ agent, stats: a }) => {
              const icon = agentIcon(agent.name);
              const low = a.matches < MIN_MATCHES;
              return (
                <div key={agent.id} className={cx(styles.panel, styles.agent, low && styles.low, "st-cut")}>
                  {icon ? (
                    <img src={icon} alt="" width={48} height={48} className={styles.agentIcon} />
                  ) : (
                    <span className={styles.agentIcon} />
                  )}
                  <div className={styles.agentInfo}>
                    <span className={styles.agentName}>{agent.name}</span>
                    <span className={styles.note}>
                      {agent.role}, {a.matches} {a.matches === 1 ? "partida" : "partidas"},{" "}
                      {low ? "amostra pequena" : `${pct(a.roundWinRate)}% dos rounds vencidos`}
                    </span>
                  </div>
                  <div className={styles.agentKd}>
                    <span className={styles.agentKdValue}>{fmt(a.kd, 2)}</span>
                    <span className={styles.note}>K/D</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.state}>Nenhum agente com partidas neste filtro.</p>
        )}
      </section>
    </div>
  );
}

type ChartMetric = "kd" | "acs";
const CHART_METRICS: Array<{
  id: ChartMetric;
  label: string;
  digits: number;
  name: string;
}> = [
  { id: "kd", label: "K/D", digits: 2, name: "K/D" },
  { id: "acs", label: "ACS", digits: 0, name: "ACS" },
];

// Geometria do gráfico no viewBox (mesma do protótipo)
const W = 960;
const H = 260;
const LEFT = 56;
const RIGHT = 944;
const TOP = 24;
const BOTTOM = 216;

/** Linha da métrica partida a partida contra a sua média, com a frase de tendência antes do gráfico. */
function EvolutionChart({ matches }: { matches: Match[] }) {
  const [metric, setMetric] = useState<ChartMetric>("kd");
  const info = CHART_METRICS.find((m) => m.id === metric)!;
  // Mais antiga à esquerda
  const items = [...matches].reverse();
  if (items.length < 2) return <p className={styles.state}>Poucas partidas para mostrar a evolução ({items.length} de 2 necessárias).</p>;

  const values = items.map((m) => (metric === "kd" ? m.kd : m.acs));
  // Média das próprias partidas do gráfico: a referência tem de ser a dos pontos desenhados
  const mean = avg(values);
  const lo = Math.min(mean, ...values);
  const hi = Math.max(mean, ...values);
  const pad = (hi - lo) * 0.15 || 1;
  // K/D e ACS nunca são negativos: o eixo começa no máximo em zero
  const [min, max] = [Math.max(0, lo - pad), hi + pad];
  const X = (i: number) => LEFT + 24 + (i * (RIGHT - LEFT - 48)) / (items.length - 1);
  const Y = (v: number) => TOP + (1 - (v - min) / (max - min)) * (BOTTOM - TOP);
  const path = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const grid = [0, 1, 2, 3, 4].map((k) => min + ((max - min) * k) / 4);

  const half = Math.floor(values.length / 2);
  const before = avg(values.slice(0, half));
  const after = avg(values.slice(-half));
  const change = (after - before) / Math.max(Math.abs(before), 0.01);
  const trend = Math.abs(change) < 0.05 ? "ficou estável" : change > 0 ? "subiu" : "caiu";
  const insight = `Seu ${info.name} ${trend} nas últimas partidas: média de ${fmt(after, info.digits)} nas ${half} mais recentes, contra ${fmt(before, info.digits)} nas ${half} anteriores.`;
  const date = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

  return (
    <div className={cx(styles.panel, styles.chart, "st-cut")}>
      <div className={styles.chartHead}>
        <p className={styles.chartInsight}>{insight}</p>
        <div role="group" aria-label="Métrica do gráfico" className={styles.segs}>
          {CHART_METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={cx(styles.seg, metric === m.id && styles.segOn)}
              aria-pressed={metric === m.id}
              onClick={() => setMetric(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.chartScroll}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${info.name} por partida: ${values.map((v) => fmt(v, info.digits)).join(", ")}`}
          className={styles.svg}
        >
          {grid.map((v) => (
            <g key={v}>
              <line x1={LEFT} x2={RIGHT} y1={Y(v)} y2={Y(v)} className={styles.gridLine} />
              <text x={LEFT - 12} y={Y(v) + 4} textAnchor="end" className={styles.axis}>
                {fmt(v, info.digits)}
              </text>
            </g>
          ))}
          <line x1={LEFT} x2={RIGHT} y1={Y(mean)} y2={Y(mean)} className={styles.meanLine} />
          <path d={path} className={styles.meLine} />
          {items.map((m, i) => (
            <g key={m.matchId}>
              <rect x={X(i) - 4} y={Y(values[i]!) - 4} width={8} height={8} className={m.won ? styles.pointWin : styles.pointLoss}>
                <title>{`${date(m.playedOn)}, ${m.map.name} contra ${m.opponent.displayName}: ${m.won ? "vitória" : "derrota"} por ${m.teamScore} a ${m.opponentScore}. ${info.name} ${fmt(values[i]!, info.digits)}.`}</title>
              </rect>
              <text x={X(i)} y={H - 12} textAnchor="middle" className={styles.xLabel}>
                {date(m.playedOn)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className={styles.legend}>
        <span>
          <span className={styles.legendMe} />
          Você
        </span>
        <span>
          <span className={styles.legendMean} />
          Média dessas {values.length} partidas ({fmt(mean, info.digits)})
        </span>
        <span>
          <span className={styles.legendLoss} />
          Partida perdida
        </span>
      </div>
    </div>
  );
}

const sideLabel: Record<Side, string> = { attack: "Ataque", defense: "Defesa" };

/** Abre Meus mapas já no mapa, lado e métrica do cartão (mortes para o que piora, abates para o que ajuda). */
const mapLink = (i: Insight) => {
  const params = new URLSearchParams({ mapa: i.map?.name.toLowerCase() ?? "", metrica: i.polarity === "positive" ? "kills" : "deaths" });
  if (i.side) params.set("lado", i.side);
  return `/player/mapas?${params.toString()}`;
};

function InsightCard({ insight: i, readOnly }: { insight: Insight; readOnly: boolean }) {
  const banner = i.map ? mapBanner(i.map.name) : undefined;
  const tone: BadgeTone = i.polarity === "negative" ? "alert" : i.polarity === "positive" ? "gold" : "neutral";
  const label = i.polarity === "positive" ? "Ponto forte" : KIND_LABEL[i.kind];
  return (
    <article className={cx(styles.panel, styles.card, banner && styles.withBanner, "st-cut")}>
      {banner ? <img src={banner} alt="" className={styles.cardBanner} /> : null}
      <div className={styles.cardBody}>
        <div className={styles.badges}>
          <Badge tone={tone} icon={i.polarity === "negative" ? "alert" : undefined}>
            {label}
          </Badge>
          {i.side ? <Badge tone={i.side}>{sideLabel[i.side]}</Badge> : null}
          {i.map ? <Badge icon="map">{i.map.name}</Badge> : null}
          {i.isEstimate ? <Badge tone="estimate">Estimativa</Badge> : null}
        </div>
        <h3 className={styles.cardTitle}>{i.title}</h3>
        <p className={styles.cardText}>{i.body}</p>
        <p className={styles.note}>{i.isEstimate ? estimateHelp(i.kind) : `Leitura feita a partir de ${fmt(i.sampleSize)} casos.`}</p>
        {i.map && !readOnly ? (
          <a href={mapLink(i)} onClick={linkHandler(mapLink(i))} className={styles.cardLink}>
            Ver no mapa
          </a>
        ) : null}
      </div>
    </article>
  );
}
