import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { q, type MapSummary } from "../../../api";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { Badge, Icon, SectionLabel, Select, Table, Tooltip } from "../../../design/primitives";
import { MAPS as FRONT_MAPS, type MapInfo } from "../../../map/mapData";
import { HeatLayer } from "../../../map/HeatLayer";
import { MapCanvas } from "../../../map/MapCanvas";
import { compareZone, MIN_ZONE_SAMPLE, type Metric, type Zone } from "./zones";
import styles from "./MapasPage.module.css";

type Side = "attack" | "defense";

const KD_HELP = "K/D: abates por morte. Acima de 1,0, você abate mais do que morre ali.";
const TRADE_HELP = "Trade: quantas vezes um aliado abateu quem matou alguém do time ali, logo em seguida.";

const METRICS: Array<{ id: Metric; label: string; help: ReactNode }> = [
  { id: "presence", label: "Presença", help: "Onde você estava quando algum abate aconteceu no round." },
  { id: "kills", label: "Abates", help: "Onde você estava quando abateu alguém." },
  { id: "deaths", label: "Mortes", help: "Onde você estava quando morreu." },
  {
    id: "kd",
    label: "Abates por morte",
    help: (
      <>
        <Tooltip term="K/D">{KD_HELP}</Tooltip> em cada local: acima de 1,0, você abate mais do que morre ali.
      </>
    ),
  },
  { id: "first_kills", label: "Primeiro abate", help: "Onde saiu o primeiro abate do round a seu favor." },
];

const MIN_TEAM_MATCHES = 5;
const fmt = (n: number, digits = 0) => n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** Liga o mapa da API (id numérico) ao minimapa local pelo nome. */
const frontMapFor = (m: MapSummary): MapInfo | undefined => FRONT_MAPS.find((f) => f.name.toLowerCase() === m.name.toLowerCase());

/** Frase-resumo antes do gráfico, como pede o spec: o heatmap vem como evidência. */
function insightFor(metric: Metric, zones: Zone[], who: string): string | null {
  const solid = zones.filter((z) => z.sampleSize >= MIN_ZONE_SAMPLE);
  if (!solid.length) return null;
  const top = [...solid].sort((a, b) => b.value - a.value)[0]!;
  switch (metric) {
    case "presence": {
      const total = solid.reduce((s, z) => s + z.presence, 0);
      return `${who} passa mais tempo em ${top.name}: ${fmt((top.presence / Math.max(1, total)) * 100)}% das posições registradas.`;
    }
    case "kills":
      return `${who} abate mais em ${top.name}: ${fmt(top.kills)} abates.`;
    case "deaths":
      return `${who} morre mais em ${top.name}: ${fmt(top.deaths)} mortes. Vale revisar como chega nesse ponto.`;
    case "kd": {
      const worst = [...solid].sort((a, b) => a.value - b.value)[0]!;
      return `Melhor troca em ${top.name} (K/D ${fmt(top.value, 2)}) e pior em ${worst.name} (K/D ${fmt(worst.value, 2)}).`;
    }
    case "first_kills":
      return `${who} abre mais rounds em ${top.name}: ${fmt(top.firstKills)} primeiros abates.`;
    default:
      return null;
  }
}

type Filters = { mapSlug: string | null; side: Side | ""; metric: Metric; team: number | null };

function readFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  const lado = params.get("lado");
  const metrica = params.get("metrica");
  const time = Number(params.get("time"));
  return {
    mapSlug: params.get("mapa")?.toLowerCase() ?? null,
    side: lado === "attack" || lado === "defense" ? lado : "",
    metric: METRICS.find((m) => m.id === metrica)?.id ?? "presence",
    team: Number.isInteger(time) && time > 0 ? time : null,
  };
}

/** Os filtros ficam na URL: o link copiado abre a mesma leitura (spec, seção 7). */
function writeFilters(f: Filters) {
  const url = new URL(window.location.href);
  const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
  set("mapa", f.mapSlug);
  set("lado", f.side || null);
  set("metrica", f.metric === "presence" ? null : f.metric);
  set("time", f.team ? String(f.team) : null);
  if (url.href !== window.location.href) window.history.replaceState(null, "", url);
}

export default function MapasPage() {
  const me = useMe();
  const isPlayer = me.role === "player";

  const maps = useQuery(q.catalog.maps());
  const teams = useQuery({ ...q.teams.list(), enabled: !isPlayer });
  const available = useMemo(
    () =>
      (maps.data ?? [])
        .map((m) => ({ api: m, front: frontMapFor(m) }))
        .filter((m): m is { api: MapSummary; front: MapInfo } => m.front != null)
        .sort((a, b) => b.api.matches - a.api.matches),
    [maps.data],
  );

  // Filtros iniciais podem vir na URL (ex.: "Ver no mapa" de um cartão ou um link compartilhado)
  const [initial] = useState(() => readFilters(window.location.search));
  const [mapSlug, setMapSlug] = useState<string | null>(initial.mapSlug);
  const [side, setSide] = useState<Side | "">(initial.side);
  const [metric, setMetric] = useState<Metric>(initial.metric);
  // Coach: o próprio time por padrão, ou outro para estudar o adversário. Admin começa com todos.
  const [teamId, setTeamId] = useState<number | null>(isPlayer ? null : (initial.team ?? me.team?.id ?? null));
  const [callouts, setCallouts] = useState(true);

  const current = available.find((m) => m.front.slug === mapSlug) ?? available[0];
  const ownTeam = me.team?.id ?? null;
  const viewedTeam = teams.data?.find((t) => t.team.id === teamId)?.team ?? (teamId === ownTeam ? me.team : null);
  const isRival = !isPlayer && teamId != null && teamId !== ownTeam;

  useEffect(() => {
    if (current) writeFilters({ mapSlug: current.front.slug, side, metric, team: teamId === ownTeam ? null : teamId });
  }, [current, side, metric, teamId, ownTeam]);

  const scope = isPlayer && me.player ? { player: me.player.id } : teamId ? { team: teamId } : {};
  const hasScope = Object.keys(scope).length > 0;
  const who = isPlayer ? "Você" : viewedTeam ? (isRival ? viewedTeam.displayName : "O time") : "Quem joga";

  const filters = { metric, ...(side ? { side } : {}) };
  const mapApiId = current?.api.id ?? 0;
  const cells = useQuery({ ...q.maps.heatmap(mapApiId, { ...scope, ...filters, resolution: "cells" }), enabled: current != null });
  const zones = useQuery({ ...q.maps.heatmap(mapApiId, { ...scope, ...filters, resolution: "zones" }), enabled: current != null });
  // Base de comparação: o mesmo mapa e filtro com todos os jogadores do campeonato
  const zonesAll = useQuery({ ...q.maps.heatmap(mapApiId, { ...filters, resolution: "zones" }), enabled: current != null && hasScope });

  const zoneRows = useMemo(
    () => [...(zones.data?.zones ?? [])].sort((a, b) => b.value - a.value).slice(0, 8).map((z) => ({ ...z, id: z.zoneId })),
    [zones.data],
  );
  const sample = (cells.data?.cells ?? []).reduce((s, c) => s + c.sampleSize, 0);
  const insight = zones.data ? insightFor(metric, zones.data.zones, who) : null;
  const metricInfo = METRICS.find((m) => m.id === metric)!;

  const teamOptions = useMemo(() => {
    const list = (teams.data ?? []).filter((t) => t.matches >= MIN_TEAM_MATCHES).sort((a, b) => a.team.displayName.localeCompare(b.team.displayName, "pt-BR"));
    const own = list.find((t) => t.team.id === ownTeam);
    return [
      ...(own ? [{ value: String(own.team.id), label: `Meu time: ${own.team.displayName}` }] : []),
      ...(me.role === "admin" ? [{ value: "", label: "Todos os times" }] : []),
      ...list.filter((t) => t.team.id !== ownTeam).map((t) => ({ value: String(t.team.id), label: `${t.team.displayName} (${t.matches} partidas)` })),
    ];
  }, [teams.data, ownTeam, me.role]);

  if (maps.error) return <p className={styles.state}>{maps.error.message}</p>;
  if (!current) return <p className={styles.state}>{maps.isPending ? "Carregando mapas." : "Nenhum mapa com dados ainda."}</p>;

  const heading = isPlayer
    ? "Heatmap pessoal"
    : viewedTeam
      ? `${isRival ? "Heatmap do adversário" : "Heatmap do time"}: ${viewedTeam.displayName}`
      : "Heatmap geral do campeonato";

  return (
    <div className={styles.page}>
      <aside className={styles.filters} aria-label="Filtros do heatmap">
        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={1} as="div">
            Filtros
          </SectionLabel>
          {!isPlayer && teamOptions.length ? (
            <Select label="Time" value={teamId ? String(teamId) : ""} options={teamOptions} onChange={(v) => setTeamId(v ? Number(v) : null)} />
          ) : null}
          <Select
            label="Mapa"
            value={current.front.slug}
            options={available.map((m) => ({ value: m.front.slug, label: `${m.api.name} (${m.api.matches} partidas)` }))}
            onChange={setMapSlug}
          />
          <div role="group" aria-label="Lado" className={styles.sides}>
            {(
              [
                ["", "Os dois lados", null],
                ["attack", "Ataque", "attack"],
                ["defense", "Defesa", "defense"],
              ] as const
            ).map(([id, label, icon]) => (
              <button key={id} type="button" className={cx(styles.option, side === id && styles.optionOn)} aria-pressed={side === id} onClick={() => setSide(id)}>
                {icon ? <Icon name={icon} size={16} className={icon === "attack" ? styles.attack : styles.defense} /> : null}
                {label}
              </button>
            ))}
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={callouts} onChange={(e) => setCallouts(e.target.checked)} />
            Mostrar callouts
          </label>
        </section>

        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={2} as="div">
            O que o mapa mostra
          </SectionLabel>
          <div role="group" aria-label="Métrica do heatmap" className={styles.metrics}>
            {METRICS.map((m) => (
              <button key={m.id} type="button" className={cx(styles.option, metric === m.id && styles.optionOn)} aria-pressed={metric === m.id} onClick={() => setMetric(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <p className={styles.help}>{metricInfo.help}</p>
          <div className={styles.legend} aria-hidden="true">
            <span>Pouco</span>
            {[1, 2, 3, 4, 5].map((k) => (
              <span key={k} className={styles.swatch} style={{ background: `var(--heat-${k})` }} />
            ))}
            <span>Muito</span>
          </div>
        </section>
      </aside>

      <div className={styles.center}>
        <div className={styles.head}>
          <SectionLabel index={3}>{heading}</SectionLabel>
          <p className={styles.insight}>{insight ?? (zones.isPending ? "Lendo as partidas." : "Poucos dados neste filtro para uma leitura confiável.")}</p>
        </div>
        <div className={styles.map}>
          <MapCanvas
            map={current.front}
            rotation={current.front.attackDownRotation}
            showCallouts={callouts}
            panOnBackground
            cursor="grab"
            label={`Heatmap de ${metricInfo.label.toLowerCase()} na ${current.front.name}`}
          >
            {(ctx) =>
              cells.data ? (
                <HeatLayer cells={cells.data.cells} grid={cells.data.grid} maxValue={cells.data.maxValue} size={ctx.size} tokens={ctx.tokens} />
              ) : null
            }
          </MapCanvas>
        </div>
        <p className={styles.caption}>
          {cells.isPending
            ? "Carregando o heatmap."
            : cells.error
              ? cells.error.message
              : `${fmt(sample)} registros de posição. Ataque embaixo, defesa em cima. Arraste para mover e use a roda do mouse para dar zoom.`}
        </p>
      </div>

      <aside className={styles.zones} aria-label="Zonas do mapa">
        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={4} as="div">
            Zonas
          </SectionLabel>
          {zoneRows.length ? (
            <Table
              caption={`As 8 zonas com mais ${metricInfo.label.toLowerCase()}. A tabela é a leitura do heatmap em texto.`}
              columns={[
                {
                  key: "name",
                  label: "Zona",
                  render: (z) => (
                    <span className={cx(z.sampleSize < MIN_ZONE_SAMPLE && styles.low)}>
                      {z.name}
                      {z.sampleSize < MIN_ZONE_SAMPLE ? (
                        <Badge tone="estimate" icon={null}>
                          Amostra pequena
                        </Badge>
                      ) : null}
                    </span>
                  ),
                },
                { key: "kills", label: "Abates", numeric: true, render: (z) => fmt(z.kills) },
                { key: "deaths", label: "Mortes", numeric: true, render: (z) => fmt(z.deaths) },
                {
                  key: "trade",
                  label: <Tooltip term="Trade">{TRADE_HELP}</Tooltip>,
                  numeric: true,
                  render: (z) => (z.tradeRate == null ? "sem dado" : `${fmt(z.tradeRate * 100)}%`),
                },
                ...(hasScope
                  ? [
                      {
                        key: "cmp",
                        label: "Contra a média",
                        numeric: true,
                        render: (z: Zone) => {
                          const c = zonesAll.data ? compareZone(metric, z, zones.data?.zones ?? [], zonesAll.data.zones) : null;
                          return c ? <span className={styles[c.tone]}>{c.text}</span> : <span className={styles.low}>sem base</span>;
                        },
                      },
                    ]
                  : []),
              ]}
              rows={zoneRows}
            />
          ) : (
            <p className={styles.help}>{zones.isPending ? "Carregando zonas." : "Sem zonas com dados neste filtro."}</p>
          )}
          {hasScope ? (
            <p className={styles.help}>
              Contra a média: quanto {isPlayer ? "da sua" : "da"} {metricInfo.label.toLowerCase()} cai na zona, comparado com todos os jogadores do campeonato no mesmo mapa e filtro.
            </p>
          ) : null}
        </section>
      </aside>
    </div>
  );
}
