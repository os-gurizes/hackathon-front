import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { q, type Heatmap, type HeatmapQuery, type MapSummary } from "../../../api";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { Badge, Icon, SectionLabel, Select, Table } from "../../../design/primitives";
import { MAPS as FRONT_MAPS, type MapInfo } from "../../../map/mapData";
import { HeatLayer } from "../../../map/HeatLayer";
import { MapCanvas } from "../../../map/MapCanvas";
import styles from "./MapasPage.module.css";

type Metric = HeatmapQuery["metric"] & string;
type Side = "attack" | "defense";
type Zone = Heatmap["zones"][number];

const METRICS: Array<{ id: Metric; label: string; help: string }> = [
  { id: "presence", label: "Presença", help: "Onde você estava quando algum abate aconteceu no round." },
  { id: "kills", label: "Abates", help: "Onde você estava quando abateu alguém." },
  { id: "deaths", label: "Mortes", help: "Onde você estava quando morreu." },
  { id: "kd", label: "K/D por local", help: "K/D: abates por morte em cada local. Acima de 1,0, você abate mais do que morre ali." },
  { id: "first_kills", label: "Primeiro abate", help: "Onde saiu o primeiro abate do round a seu favor." },
];

const MIN_ZONE_SAMPLE = 8;
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

function readInitialFilters(search: string): { mapSlug: string | null; side: Side | ""; metric: Metric } {
  const params = new URLSearchParams(search);
  const lado = params.get("lado");
  const metrica = params.get("metrica");
  return {
    mapSlug: params.get("mapa")?.toLowerCase() ?? null,
    side: lado === "attack" || lado === "defense" ? lado : "",
    metric: METRICS.find((m) => m.id === metrica)?.id ?? "presence",
  };
}

export default function MapasPage() {
  const me = useMe();
  const isPlayer = me.role === "player";
  const scope = isPlayer && me.player ? { player: me.player.id } : me.team ? { team: me.team.id } : {};
  // Admin não tem time: vê todos os jogadores do campeonato
  const who = isPlayer ? "Você" : me.team ? "O time" : "Quem joga";

  const maps = useQuery(q.catalog.maps());
  const available = useMemo(
    () =>
      (maps.data ?? [])
        .map((m) => ({ api: m, front: frontMapFor(m) }))
        .filter((m): m is { api: MapSummary; front: MapInfo } => m.front != null)
        .sort((a, b) => b.api.matches - a.api.matches),
    [maps.data],
  );

  // Filtros iniciais podem vir na URL (ex.: "Ver no mapa" de um cartão de Meu desempenho)
  const [initial] = useState(() => readInitialFilters(window.location.search));
  const [mapId, setMapId] = useState<number | null>(null);
  const [side, setSide] = useState<Side | "">(initial.side);
  const [metric, setMetric] = useState<Metric>(initial.metric);
  const [callouts, setCallouts] = useState(true);

  const current =
    available.find((m) => m.api.id === mapId) ?? available.find((m) => m.front.slug === initial.mapSlug) ?? available[0];
  const filters = { ...scope, metric, ...(side ? { side } : {}) };
  const cells = useQuery({ ...q.maps.heatmap(current?.api.id ?? 0, { ...filters, resolution: "cells" }), enabled: current != null });
  const zones = useQuery({ ...q.maps.heatmap(current?.api.id ?? 0, { ...filters, resolution: "zones" }), enabled: current != null });

  const zoneRows = useMemo(
    () => [...(zones.data?.zones ?? [])].sort((a, b) => b.value - a.value).slice(0, 8).map((z) => ({ ...z, id: z.zoneId })),
    [zones.data],
  );
  const sample = (cells.data?.cells ?? []).reduce((s, c) => s + c.sampleSize, 0);
  const insight = zones.data ? insightFor(metric, zones.data.zones, who) : null;
  const metricInfo = METRICS.find((m) => m.id === metric)!;

  if (maps.error) return <p className={styles.state}>{maps.error.message}</p>;
  if (!current) return <p className={styles.state}>{maps.isPending ? "Carregando mapas." : "Nenhum mapa com dados ainda."}</p>;

  return (
    <div className={styles.page}>
      <aside className={styles.filters} aria-label="Filtros do heatmap">
        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={1} as="div">
            Filtros
          </SectionLabel>
          <Select
            label="Mapa"
            value={String(current.api.id)}
            options={available.map((m) => ({ value: String(m.api.id), label: `${m.api.name} (${m.api.matches} partidas)` }))}
            onChange={(v) => setMapId(Number(v))}
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
          <SectionLabel index={3}>{isPlayer ? "Heatmap pessoal" : me.team ? `Heatmap do time: ${me.team.displayName}` : "Heatmap geral do campeonato"}</SectionLabel>
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
                { key: "trade", label: "Trade", numeric: true, render: (z) => (z.tradeRate == null ? "sem dado" : `${fmt(z.tradeRate * 100)}%`) },
              ]}
              rows={zoneRows}
            />
          ) : (
            <p className={styles.help}>{zones.isPending ? "Carregando zonas." : "Sem zonas com dados neste filtro."}</p>
          )}
          <p className={styles.help}>Trade: quantas vezes um aliado abateu quem matou alguém do time ali, logo em seguida.</p>
        </section>
      </aside>
    </div>
  );
}
