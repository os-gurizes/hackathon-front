import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { q, type PlayerMatches } from "../../../api";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { Badge, SectionLabel, Select, Table, Tooltip } from "../../../design/primitives";
import { AGENTS, assetUrl } from "../../../map/mapData";
import { diff, fmt, pct } from "../shared";
import styles from "../player.module.css";

type Match = PlayerMatches["items"][number];

const dia = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
const iconOf = (name: string) => AGENTS.find((a) => a.name.toLowerCase() === name.toLowerCase())?.icon;

/** Frase-resumo: vitórias, e a melhor e a pior partida pelo K/D. */
function insightFor(items: Match[], mapName: string | null): string {
  if (!items.length) return "Nenhuma partida registrada neste filtro.";
  const wins = items.filter((m) => m.won).length;
  const best = [...items].sort((a, b) => b.kd - a.kd)[0]!;
  const onde = mapName ? ` na ${mapName}` : "";
  return `Você venceu ${wins} de ${items.length} partidas${onde} (${pct(wins / items.length)}). Seu melhor jogo foi contra ${best.opponent.displayName}: K/D ${fmt(best.kd, 2)} jogando de ${best.agent.name}.`;
}

export default function PartidasPage() {
  const me = useMe();
  const playerId = me.player?.id;
  const [mapId, setMapId] = useState<number | null>(null);
  const maps = useQuery(q.catalog.maps());
  const matches = useQuery({
    ...q.players.matches(playerId ?? 0, { limit: 50, ...(mapId ? { map: mapId } : {}) }),
    enabled: playerId != null,
    placeholderData: keepPreviousData,
  });
  const totals = useQuery({ ...q.players.get(playerId ?? 0), enabled: playerId != null });

  if (playerId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um jogador. Peça ao admin para vincular.</p>;
  if (matches.error) return <p className={styles.state}>{matches.error.message}</p>;

  const items = matches.data?.items ?? [];
  const avgKd = totals.data?.totals.kd ?? null;
  const mapName = maps.data?.find((m) => m.id === mapId)?.name ?? null;

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.filters}>
          <Select
            label="Mapa"
            value={mapId ? String(mapId) : ""}
            options={[{ value: "", label: "Todos os mapas" }, ...(maps.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))]}
            onChange={(v) => setMapId(v ? Number(v) : null)}
          />
        </div>
        <SectionLabel index={1}>Partidas</SectionLabel>
        <p className={styles.insight}>{matches.isPending ? "Carregando suas partidas." : insightFor(items, mapName)}</p>
      </section>

      <section className={styles.section}>
        <SectionLabel index={2}>Histórico</SectionLabel>
        {items.length ? (
          <div className={styles.tableWrap}>
            <Table
              caption={
                avgKd != null ? (
                  <>
                    Mais recentes primeiro. A última coluna compara o <Tooltip term="K/D">K/D: abates por morte. Acima de 1,0, você abate mais do que morre.</Tooltip> da partida com a sua média geral ({fmt(avgKd, 2)}).
                  </>
                ) : (
                  "Mais recentes primeiro."
                )
              }
              columns={[
                { key: "data", label: "Data", render: (m: Match & { id: number }) => dia(m.playedOn) },
                { key: "mapa", label: "Mapa", render: (m) => m.map.name },
                { key: "adv", label: "Adversário", render: (m) => m.opponent.displayName },
                {
                  key: "placar",
                  label: "Placar",
                  render: (m) => (
                    <span className={styles.cell}>
                      <Badge tone={m.won ? "ok" : "alert"} icon={null}>
                        {m.won ? "Vitória" : "Derrota"}
                      </Badge>
                      {m.teamScore} x {m.opponentScore}
                    </span>
                  ),
                },
                {
                  key: "agente",
                  label: "Agente",
                  render: (m) => {
                    const icon = iconOf(m.agent.name);
                    return (
                      <span className={styles.cell}>
                        {icon ? <img src={assetUrl(icon)} alt="" width={24} height={24} /> : null}
                        {m.agent.name}
                      </span>
                    );
                  },
                },
                { key: "acs", label: "ACS", numeric: true, render: (m) => fmt(m.acs) },
                { key: "kda", label: "Abates / mortes / assist.", numeric: true, render: (m) => `${m.kills} / ${m.deaths} / ${m.assists}` },
                {
                  key: "kd",
                  label: "K/D contra a média",
                  numeric: true,
                  render: (m) => (
                    <span>
                      {fmt(m.kd, 2)}{" "}
                      {avgKd != null ? <span className={cx(m.kd >= avgKd ? styles.up : styles.down)}>({diff(m.kd, avgKd)})</span> : null}
                    </span>
                  ),
                },
              ]}
              rows={items.map((m) => ({ ...m, id: m.matchId }))}
            />
          </div>
        ) : (
          <p className={styles.help}>{matches.isPending ? "Carregando." : "Nenhuma partida neste mapa."}</p>
        )}
      </section>
    </div>
  );
}
