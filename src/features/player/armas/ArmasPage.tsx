import { useQuery } from "@tanstack/react-query";
import { q, type PlayerWeapons } from "../../../api";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { SectionLabel, Stat, Table, Tooltip } from "../../../design/primitives";
import { assetUrl, WEAPONS } from "../../../map/mapData";
import { fmt, pct, pp, tone } from "../shared";
import styles from "../player.module.css";

type Weapon = PlayerWeapons[number];

const DIST: Array<[keyof Weapon["killsByDistance"], string]> = [
  ["under10", "Até 10 m"],
  ["from10to20", "10 a 20 m"],
  ["from20to30", "20 a 30 m"],
  ["over30", "Mais de 30 m"],
];

const iconOf = (name: string) => WEAPONS.find((w) => w.name.toLowerCase() === name.toLowerCase())?.icon;
const MIN_ROUNDS = 20;

function insightFor(main: Weapon): string {
  const d = (main.winRateEquipped - main.baseline.winRateEquipped) * 100;
  const comp = Math.abs(d) < 2 ? "na média de quem usa a mesma arma" : `${fmt(Math.abs(d), 1)} p.p. ${d > 0 ? "acima" : "abaixo"} da média de quem usa a mesma arma`;
  return `A ${main.weapon.name} é a sua arma principal: ${main.kills} abates. Com ela, você vence ${pct(main.winRateEquipped)} dos rounds, ${comp}.`;
}

function DistanceBars({ w }: { w: Weapon }) {
  const total = DIST.reduce((s, [k]) => s + w.killsByDistance[k], 0) || 1;
  return (
    <div className={styles.bars} aria-label={`Abates por distância com a ${w.weapon.name}`}>
      {DIST.map(([k, label]) => (
        <div key={k} className={styles.bar}>
          <span>{label}</span>
          <span className={styles.barTrack}>
            <span className={styles.barFill} style={{ width: `${(w.killsByDistance[k] / total) * 100}%`, display: "block" }} />
          </span>
          <span>{pct(w.killsByDistance[k] / total)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ArmasPage() {
  const me = useMe();
  const playerId = me.player?.id;
  const weapons = useQuery({ ...q.players.weapons(playerId ?? 0), enabled: playerId != null });

  if (playerId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um jogador. Peça ao admin para vincular.</p>;
  if (weapons.error) return <p className={styles.state}>{weapons.error.message}</p>;
  if (weapons.isPending) return <p className={styles.state}>Carregando suas armas.</p>;

  const list = [...weapons.data].sort((a, b) => b.kills - a.kills);
  const top = list.filter((w) => w.roundsEquipped >= MIN_ROUNDS).slice(0, 3);
  if (!list.length) return <p className={styles.state}>Nenhum abate registrado ainda.</p>;

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <SectionLabel index={1}>Armas</SectionLabel>
        <p className={styles.insight}>{insightFor(top[0] ?? list[0]!)}</p>
      </section>

      <section className={styles.section}>
        <SectionLabel index={2}>As que você mais usa</SectionLabel>
        <div className={styles.grid}>
          {top.map((w) => {
            const icon = iconOf(w.weapon.name);
            return (
              <article key={w.weapon.id} className={cx(styles.panel, "st-cut")}>
                <div className={styles.panelHead}>
                  {icon ? <img src={assetUrl(icon)} alt="" width={96} height={24} style={{ objectFit: "contain", background: "transparent" }} /> : null}
                  <div>
                    <h3 className={styles.title}>{w.weapon.name}</h3>
                    <p className={styles.sub}>
                      {w.kills} abates, {w.firstKills} primeiros abates, {w.roundsEquipped} rounds com ela
                    </p>
                  </div>
                </div>
                <div className={styles.stats}>
                  <Stat
                    label="Vitória"
                    value={fmt(w.winRateEquipped * 100)}
                    unit="%"
                    delta={pp(w.winRateEquipped, w.baseline.winRateEquipped)}
                    deltaTone={tone(w.winRateEquipped, w.baseline.winRateEquipped, 0.02)}
                    comparison="contra a média"
                  />
                  <Stat
                    label={<Tooltip term="HS%">HS%: porcentagem dos seus acertos que foram na cabeça.</Tooltip>}
                    value={fmt(w.headshotRateEquipped * 100)}
                    unit="%"
                    delta={pp(w.headshotRateEquipped, w.baseline.headshotRateEquipped)}
                    deltaTone={tone(w.headshotRateEquipped, w.baseline.headshotRateEquipped, 0.02)}
                    comparison="contra a média"
                  />
                  {w.averageDistance != null ? (
                    <Stat
                      label="Distância"
                      value={fmt(w.averageDistance, 1)}
                      unit="m"
                      comparison={w.baseline.averageDistance != null ? `média de quem usa: ${fmt(w.baseline.averageDistance, 1)} m` : undefined}
                    />
                  ) : null}
                </div>
                <DistanceBars w={w} />
              </article>
            );
          })}
        </div>
        <p className={styles.note}>A média é a de todos os jogadores do campeonato com a mesma arma. Armas com menos de {MIN_ROUNDS} rounds ficam só na tabela abaixo.</p>
      </section>

      <section className={styles.section}>
        <SectionLabel index={3}>Todas as armas</SectionLabel>
        <div className={styles.tableWrap}>
          <Table
            caption="Ordenadas por abates."
            columns={[
              {
                key: "arma",
                label: "Arma",
                render: (w: Weapon & { id: number }) => (
                  <span className={cx(styles.cell, w.roundsEquipped < MIN_ROUNDS && styles.low)}>
                    {w.weapon.name}
                    {w.roundsEquipped < MIN_ROUNDS ? <span className={styles.muted}>(amostra pequena)</span> : null}
                  </span>
                ),
              },
              { key: "kills", label: "Abates", numeric: true, render: (w) => fmt(w.kills) },
              { key: "fk", label: "Primeiros abates", numeric: true, render: (w) => fmt(w.firstKills) },
              { key: "rounds", label: "Rounds com ela", numeric: true, render: (w) => fmt(w.roundsEquipped) },
              {
                key: "win",
                label: "Vitória contra a média",
                numeric: true,
                render: (w) => (
                  <span>
                    {pct(w.winRateEquipped)}{" "}
                    <span className={cx(w.winRateEquipped >= w.baseline.winRateEquipped ? styles.up : styles.down)}>({pp(w.winRateEquipped, w.baseline.winRateEquipped)})</span>
                  </span>
                ),
              },
              { key: "hs", label: "HS%", numeric: true, render: (w) => pct(w.headshotRateEquipped) },
            ]}
            rows={list.map((w) => ({ ...w, id: w.weapon.id }))}
          />
        </div>
      </section>
    </div>
  );
}
