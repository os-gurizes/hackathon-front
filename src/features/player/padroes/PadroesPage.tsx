import { useQuery } from "@tanstack/react-query";
import { q, type PlayerPatterns } from "../../../api";
import { linkHandler } from "../../../app/router";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { Badge, SectionLabel } from "../../../design/primitives";
import { fmt, pct } from "../shared";
import styles from "../player.module.css";

type Pattern = PlayerPatterns[number];

const PATTERN_LABEL: Record<Pattern["pattern"], string> = {
  isolated_death: "Morte sem apoio do time",
  first_death_zone: "Primeira morte no mesmo lugar",
  repeat_after_first_death: "Repete o erro depois de morrer primeiro",
  predictable_route: "Rota previsível",
};

const SIDE: Record<Pattern["side"], string> = { attack: "Ataque", defense: "Defesa" };
const inSide = (s: Pattern["side"]) => (s === "attack" ? "no ataque" : "na defesa");

/** Frase do cartão: o que acontece, onde e quanto acima da média. */
function describe(p: Pattern): string {
  const onde = p.zone ? ` em ${p.zone.name}` : "";
  const vezes = p.baselineRate > 0 ? p.rate / p.baselineRate : null;
  const comp = vezes != null && vezes >= 1.2 ? `, ${fmt(vezes, 1)} vezes a média de jogadores da mesma função` : "";
  return `Na ${p.map.name}, ${inSide(p.side)}${onde}: acontece em ${pct(p.rate)} dos rounds (${p.occurrences} de ${p.rounds})${comp}.`;
}

const mapLink = (p: Pattern) => `/player/mapas?${new URLSearchParams({ mapa: p.map.name.toLowerCase(), lado: p.side, metrica: "deaths" }).toString()}`;

function PatternCard({ p }: { p: Pattern }) {
  const link = mapLink(p);
  return (
    <article className={cx(styles.panel, "st-cut")}>
      <div className={styles.badges}>
        <Badge tone={p.tier === "confirmed" ? "alert" : "neutral"} icon={p.tier === "confirmed" ? "alert" : undefined}>
          {p.tier === "confirmed" ? "Confirmado" : "Observar"}
        </Badge>
        <Badge tone={p.side}>{SIDE[p.side]}</Badge>
        <Badge icon="map">{p.map.name}</Badge>
      </div>
      <h3 className={styles.title}>{PATTERN_LABEL[p.pattern]}</h3>
      <dl className={styles.facts}>
        <dt>O que acontece</dt>
        <dd>{describe(p)}</dd>
        <dt>Quanto custa</dt>
        <dd>
          Cerca de {fmt(p.costRounds, 1)} {Math.round(p.costRounds) === 1 ? "round perdido" : "rounds perdidos"} a mais do que o esperado.
        </dd>
        {p.examples.length ? (
          <>
            <dt>Exemplos</dt>
            <dd>{p.examples.slice(0, 5).map((e) => `round ${e.number + 1}`).join(", ")}</dd>
          </>
        ) : null}
      </dl>
      <a href={link} onClick={linkHandler(link)} className={styles.link}>
        Ver no mapa
      </a>
    </article>
  );
}

export default function PadroesPage() {
  const me = useMe();
  const playerId = me.player?.id;
  const patterns = useQuery({ ...q.players.patterns(playerId ?? 0), enabled: playerId != null });

  if (playerId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um jogador. Peça ao admin para vincular.</p>;
  if (patterns.error) return <p className={styles.state}>{patterns.error.message}</p>;
  if (patterns.isPending) return <p className={styles.state}>Procurando seus padrões.</p>;

  const list = [...patterns.data].sort((a, b) => Number(b.tier === "confirmed") - Number(a.tier === "confirmed") || b.costRounds - a.costRounds);
  const confirmed = list.filter((p) => p.tier === "confirmed").length;
  const first = list[0];

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <SectionLabel index={1}>Meus padrões</SectionLabel>
        <p className={styles.insight}>
          {first
            ? `Encontramos ${list.length} ${list.length === 1 ? "padrão" : "padrões"} que se repetem nas suas partidas${confirmed ? `, ${confirmed} ${confirmed === 1 ? "confirmado" : "confirmados"}` : ", nenhum confirmado ainda"}. O que mais custa: ${PATTERN_LABEL[first.pattern].toLowerCase()} na ${first.map.name}.`
            : "Nenhum padrão repetido apareceu nas suas partidas. Bom sinal."}
        </p>
        <p className={styles.help}>Confirmado: aparece bem acima da média e em amostra suficiente. Observar: ainda pode ser coincidência.</p>
      </section>
      {list.length ? (
        <section className={styles.section}>
          <SectionLabel index={2}>O que treinar</SectionLabel>
          <div className={styles.grid}>
            {list.map((p, i) => (
              <PatternCard key={`${p.pattern}-${p.map.id}-${p.side}-${p.zone?.id ?? i}`} p={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
