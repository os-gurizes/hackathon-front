import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { q, type teamsService } from "../../../api";
import { navigate } from "../../../app/router";
import { useMe } from "../../../app/session";
import { estimateHelp } from "../../../copy/estimates";
import { cx } from "../../../design/cx";
import { Badge, Button, SectionLabel, Select, Stat, Table } from "../../../design/primitives";
import { assetUrl, MAPS as FRONT_MAPS } from "../../../map/mapData";
import { pranchetaLink } from "../pranchetaLink";
import styles from "./EstrategiasPage.module.css";

// Coach, Estratégias. Setups que o ETL detectou nos rounds do time, por mapa e lado,
// com a taxa de vitória de cada um: os que mais funcionam, os que menos funcionam e a lista completa.

// Tipo do serviço, não do contrato: o cliente devolve o intervalo como lista, não como par
type Row = Awaited<ReturnType<typeof teamsService.strategies>>[number];
type Side = "attack" | "defense";

/** Abaixo disso a estratégia não entra em "melhores" e "piores": pouco round para uma leitura confiável. */
const MIN_ROUNDS = 10;
const TOP = 3;

const pct = (rate: number) => Math.round(rate * 100);
const signedPp = (rate: number, base: number) => {
  const d = pct(rate) - pct(base);
  return `${d > 0 ? "+" : d < 0 ? "-" : ""}${Math.abs(d)} p.p.`;
};
/** Faixa provável da taxa (intervalo de confiança de 95%). */
const range = (r: Row) => {
  const [lo = r.winRate, hi = r.winRate] = r.confidenceInterval;
  return `${pct(lo)}% a ${pct(hi)}%`;
};
const sideLabel: Record<Side, string> = { attack: "Ataque", defense: "Defesa" };

const bannerFor = (name: string) => {
  const m = FRONT_MAPS.find((f) => f.name.toLowerCase() === name.toLowerCase());
  return m ? assetUrl(m.banner) : undefined;
};

/** Site em que a estratégia mais planta. Aceita contagem ou fração por site, normalizando para fração. */
function mainSite(plantSites: Record<string, number>) {
  const entries = Object.entries(plantSites);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!entries.length || !total) return null;
  const [site, v] = entries.sort((a, b) => b[1] - a[1])[0]!;
  return { site, share: total > 1 ? v / total : v };
}

/** Frase-resumo antes dos cartões: a melhor e a pior estratégia com amostra confiável. */
function headline(best: Row | undefined, worst: Row | undefined) {
  if (!best) return "Ainda não há estratégias com rounds suficientes para uma leitura confiável.";
  const b = `A estratégia que mais funciona é "${best.strategy.title}" na ${best.strategy.map.name}: o time vence ${pct(best.winRate)}% desses rounds.`;
  if (!worst || worst === best) return b;
  return `${b} A que menos funciona é "${worst.strategy.title}" na ${worst.strategy.map.name}, com ${pct(worst.winRate)}%.`;
}

export default function EstrategiasPage() {
  const me = useMe();
  const teamId = me.team?.id;

  const [mapId, setMapId] = useState("");
  const [side, setSide] = useState<Side | "">("");
  const filters = { ...(mapId ? { map: Number(mapId) } : {}), ...(side ? { side } : {}) };
  const filtered = mapId !== "" || side !== "";

  // A lista sem filtro dá as opções de mapa; com filtro, a API devolve só o recorte
  const all = useQuery({ ...q.teams.strategies(teamId ?? 0), enabled: teamId != null });
  const list = useQuery({
    ...q.teams.strategies(teamId ?? 0, filtered ? filters : undefined),
    enabled: teamId != null,
    placeholderData: keepPreviousData,
  });

  if (teamId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um time.</p>;
  if (list.error) return <p className={styles.state}>{list.error.message}</p>;
  if (list.isPending) return <p className={styles.state}>Carregando as estratégias.</p>;

  const rows = list.data.filter((r) => !r.strategy.isNoise);
  const noiseRounds = list.data.filter((r) => r.strategy.isNoise).reduce((s, r) => s + r.rounds, 0);
  const reliable = rows.filter((r) => r.rounds >= MIN_ROUNDS);
  const best = [...reliable].sort((a, b) => b.winRate - a.winRate).slice(0, TOP);
  // Com poucas estratégias as listas se cruzariam: a pior não pode aparecer também entre as melhores
  const worst = [...reliable]
    .sort((a, b) => a.winRate - b.winRate)
    .filter((r) => !best.includes(r))
    .slice(0, TOP);

  const maps = new Map((all.data ?? []).map((r) => [r.strategy.map.id, r.strategy.map.name]));
  const mapOptions = [{ value: "", label: "Todos os mapas" }, ...[...maps].map(([id, name]) => ({ value: String(id), label: name }))];

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
        <SectionLabel index={1}>O que mais funciona</SectionLabel>
        <p className={styles.headline}>{headline(best[0], worst[0])}</p>
        <p className={styles.estimate}>
          <Badge tone="estimate">Estimativa</Badge>
          <span>{estimateHelp("strategy")}</span>
        </p>
        <StrategyCards rows={best} empty="Nenhuma estratégia com rounds suficientes neste filtro." />
      </section>

      <section className={styles.section}>
        <SectionLabel index={2}>O que menos funciona</SectionLabel>
        <StrategyCards rows={worst} empty="Não há outras estratégias com rounds suficientes para comparar." />
      </section>

      <section className={styles.section}>
        <SectionLabel index={3}>Todas as estratégias</SectionLabel>
        {rows.length ? (
          <div className={cx(styles.panel, "st-cut")}>
            <div className={styles.scroll}>
              <Table
                rows={[...rows].sort((a, b) => b.winRate - a.winRate).map((r) => ({ ...r, id: r.strategy.id }))}
                columns={[
                  { key: "map", label: "Mapa", render: (r) => r.strategy.map.name },
                  {
                    key: "side",
                    label: "Lado",
                    render: (r) => <Badge tone={r.strategy.side}>{sideLabel[r.strategy.side]}</Badge>,
                  },
                  { key: "title", label: "Estratégia", render: (r) => r.strategy.title },
                  {
                    key: "rounds",
                    label: "Rounds",
                    numeric: true,
                    render: (r) => `${r.rounds}${r.rounds < MIN_ROUNDS ? " (pouco)" : ""}`,
                  },
                  { key: "winRate", label: "Vencidos", numeric: true, render: (r) => `${pct(r.winRate)}%` },
                  {
                    key: "range",
                    label: "Faixa provável",
                    numeric: true,
                    render: range,
                  },
                  {
                    key: "open",
                    label: <span className={styles.srOnly}>Ações</span>,
                    render: (r) => (
                      <Button variant="ghost" size="sm" onClick={() => navigate(pranchetaLink(r.strategy))}>
                        Abrir na prancheta
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
            <p className={styles.note}>
              Faixa provável: onde a taxa de vitória deve estar de verdade, considerando quantos rounds foram jogados. Quanto menos
              rounds, mais larga a faixa. Estratégias com menos de {MIN_ROUNDS} rounds não entram nas listas acima.
              {noiseRounds ? ` ${noiseRounds} rounds sem um setup claro ficaram de fora.` : ""}
            </p>
          </div>
        ) : (
          <p className={styles.state}>Nenhuma estratégia detectada neste filtro.</p>
        )}
      </section>
    </div>
  );
}

function StrategyCards({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <p className={styles.state}>{empty}</p>;
  return (
    <div className={styles.cards}>
      {rows.map((r) => {
        const s = r.strategy;
        const banner = bannerFor(s.map.name);
        const site = s.side === "attack" ? mainSite(s.plantSites) : null;
        return (
          <article key={s.id} className={cx(styles.panel, styles.card, banner && styles.withBanner, "st-cut")}>
            {banner ? <img src={banner} alt="" className={styles.banner} /> : null}
            <div className={styles.badges}>
              <Badge tone={s.side}>{sideLabel[s.side]}</Badge>
              <Badge icon="map">{s.map.name}</Badge>
            </div>
            <h3 className={styles.cardTitle}>{s.title}</h3>
            <p className={styles.cardText}>{s.description}</p>
            <Stat
              label="Rounds vencidos"
              help="Porcentagem dos rounds com essa estratégia que o time venceu."
              value={String(pct(r.winRate))}
              unit="%"
              delta={signedPp(r.winRate, s.overallWinRate)}
              comparison={`contra ${pct(s.overallWinRate)}% no campeonato com o mesmo setup`}
              sample={r.rounds}
              minSample={MIN_ROUNDS}
            />
            <p className={styles.note}>
              {r.wins} vitórias em {r.rounds} rounds. A taxa real deve estar entre {range(r).replace(" a ", " e ")}.
              {site ? ` Planta mais no ${site.site} (${pct(site.share)}% dos plants)` : ""}
              {site && s.plantTimeSeconds != null ? `, por volta de ${Math.round(s.plantTimeSeconds)} s de round.` : site ? "." : ""}
            </p>
            <Button size="sm" className={styles.action} onClick={() => navigate(pranchetaLink(s))}>
              Abrir na prancheta
            </Button>
          </article>
        );
      })}
    </div>
  );
}
