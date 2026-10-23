import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { q, type MatchList } from "../../../api";
import { useTeamScope } from "../../../app/teamScope";
import { cx } from "../../../design/cx";
import { Badge, Button, Icon, SectionLabel } from "../../../design/primitives";
import { MAPS as FRONT_MAPS } from "../../../map/mapData";
import { MapCanvas } from "../../../map/MapCanvas";
import { clock, describe, resultLabel, teamWinCurve } from "./replay";
import { ReplayLayer } from "./ReplayLayer";
import { WinProbChart } from "./WinProbChart";
import styles from "./PartidaPage.module.css";

type MatchItem = MatchList["items"][number];

const STEP_MS = 1400;

const dia = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function readUrl() {
  const p = new URLSearchParams(window.location.search);
  const num = (k: string) => {
    const v = Number(p.get(k));
    return Number.isInteger(v) && v >= 0 && p.get(k) !== null ? v : null;
  };
  return { match: num("partida"), round: num("round") };
}

/** Partida e round ficam na URL: o link abre o mesmo replay. */
function writeUrl(match: number | null, round: number | null) {
  const url = new URL(window.location.href);
  if (match != null) url.searchParams.set("partida", String(match));
  if (round != null) url.searchParams.set("round", String(round));
  if (url.href !== window.location.href) window.history.replaceState(null, "", url);
}

/** O lado do time e o adversário na partida, do ponto de vista de quem está olhando. */
function perspective(m: MatchItem, teamId: number | null) {
  const mine = teamId != null && m.blue.team.id === teamId ? m.blue : teamId != null && m.red.team.id === teamId ? m.red : m.blue;
  const other = mine === m.blue ? m.red : m.blue;
  return { mine, other, won: m.winnerTeamId === mine.team.id };
}

export default function PartidaPage() {
  const teamId = useTeamScope()?.id ?? null;
  const [initial] = useState(readUrl);
  const [matchId, setMatchId] = useState<number | null>(initial.match);
  const [roundN, setRoundN] = useState<number | null>(initial.round);
  // O passo do replay recomeça a cada round: guardado junto com o round a que pertence
  const [step, setStep] = useState<{ key: string; index: number }>({ key: "", index: 0 });
  const [playing, setPlaying] = useState(false);

  const matches = useQuery(q.matches.list({ ...(teamId ? { team: teamId } : {}), limit: 30 }));
  const list = matches.data?.items ?? [];
  const match = list.find((m) => m.id === matchId) ?? list[0];
  const rounds = useQuery({ ...q.matches.rounds(match?.id ?? 0), enabled: match != null });
  const roundList = rounds.data ?? [];
  const round = roundList.find((r) => r.number === roundN) ?? roundList[0];
  const replay = useQuery({ ...q.matches.replay(match?.id ?? 0, round?.number ?? 0), enabled: match != null && round != null });

  const events = replay.data?.events ?? [];
  const key = `${match?.id}:${round?.number}`;
  const index = step.key === key ? Math.min(step.index, Math.max(events.length - 1, 0)) : 0;
  const setIndex = (i: number) => setStep({ key, index: Math.max(0, Math.min(i, events.length - 1)) });
  const atEnd = index >= events.length - 1;

  useEffect(() => {
    if (match) writeUrl(match.id, round?.number ?? null);
  }, [match, round]);

  // Reprodução: um evento a cada STEP_MS até o fim do round
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      const t = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep({ key, index: index + 1 }), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, atEnd, index, key]);

  if (matches.error) return <p className={styles.state}>{matches.error.message}</p>;
  if (!match) return <p className={styles.state}>{matches.isPending ? "Carregando partidas." : "Nenhuma partida registrada para o time."}</p>;

  const view = perspective(match, teamId);
  const front = FRONT_MAPS.find((f) => f.name.toLowerCase() === match.map.name.toLowerCase());
  const myTeamId = view.mine.team.id;
  const current = events[index];
  const won = round ? round.winnerTeamId === myTeamId : false;
  const mySide = round ? (round.attackTeamId === myTeamId ? "attack" : "defense") : null;

  const pickMatch = (id: number) => {
    setMatchId(id);
    setRoundN(null);
    setPlaying(false);
  };
  const pickRound = (n: number) => {
    setRoundN(n);
    setPlaying(false);
  };

  return (
    <div className={styles.page}>
      <aside className={styles.left} aria-label="Partidas e rounds">
        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={1} as="div">
            Partidas
          </SectionLabel>
          <ul className={styles.matches}>
            {list.map((m) => {
              const v = perspective(m, teamId);
              return (
                <li key={m.id}>
                  <button type="button" className={cx(styles.match, m.id === match.id && styles.on)} aria-pressed={m.id === match.id} onClick={() => pickMatch(m.id)}>
                    <span className={cx(styles.result, v.won ? styles.win : styles.loss)}>{v.won ? "V" : "D"}</span>
                    <span className={styles.matchText}>
                      <strong>
                        {v.mine.score} x {v.other.score} {v.other.team.displayName}
                      </strong>
                      <span>
                        {m.map.name} · {dia(m.playedOn)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={2} as="div">
            Rounds
          </SectionLabel>
          {rounds.isPending ? (
            <p className={styles.help}>Carregando rounds.</p>
          ) : (
            <div className={styles.rounds} role="group" aria-label="Rounds da partida">
              {roundList.map((r) => {
                const w = r.winnerTeamId === myTeamId;
                return (
                  <button
                    key={r.number}
                    type="button"
                    className={cx(styles.round, w ? styles.win : styles.loss, r.number === round?.number && styles.roundOn)}
                    aria-pressed={r.number === round?.number}
                    aria-label={`Round ${r.number + 1}: ${w ? "vitória" : "derrota"}, ${resultLabel(r.resultCode).toLowerCase()}`}
                    title={`Round ${r.number + 1}: ${w ? "vitória" : "derrota"} (${resultLabel(r.resultCode)})`}
                    onClick={() => pickRound(r.number)}
                  >
                    <span>{r.number + 1}</span>
                    <small>{w ? "V" : "D"}</small>
                  </button>
                );
              })}
            </div>
          )}
          <p className={styles.help}>V: o time venceu o round. D: perdeu. Clique para ver o replay.</p>
        </section>
      </aside>

      <div className={styles.center}>
        <div className={styles.head}>
          <SectionLabel index={3}>
            {view.mine.team.displayName} {view.mine.score} x {view.other.score} {view.other.team.displayName}
          </SectionLabel>
          {round ? (
            <p className={styles.insight}>
              Round {round.number + 1}: {won ? "vitória" : "derrota"} {mySide === "attack" ? "no ataque" : "na defesa"} por {resultLabel(round.resultCode).toLowerCase()}
              {round.plantSite ? `, spike plantada no ${round.plantSite}` : ""}.
            </p>
          ) : null}
          <div className={styles.badges}>
            <Badge icon="map">{match.map.name}</Badge>
            {mySide ? <Badge tone={mySide}>{mySide === "attack" ? "Ataque" : "Defesa"}</Badge> : null}
            <Badge icon={null}>{dia(match.playedOn)}</Badge>
          </div>
        </div>

        <div className={styles.map}>
          {front ? (
            <MapCanvas map={front} rotation={front.attackDownRotation} showCallouts panOnBackground cursor="grab" label={`Replay do round ${(round?.number ?? 0) + 1} na ${front.name}`}>
              {(ctx) => (replay.data ? <ReplayLayer ctx={ctx} events={events} players={replay.data.players} index={index} /> : null)}
            </MapCanvas>
          ) : (
            <p className={styles.state}>Sem minimapa para {match.map.name}.</p>
          )}
        </div>

        <div className={cx(styles.controls, "st-cut")} role="group" aria-label="Controles do replay">
          <Button variant="ghost" size="sm" icon="undo" aria-label="Evento anterior" disabled={index === 0} onClick={() => setIndex(index - 1)} />
          <Button
            variant="primary"
            size="sm"
            icon={playing ? "pause" : "play"}
            disabled={events.length < 2}
            onClick={() => {
              if (!playing && atEnd) setIndex(0);
              setPlaying(!playing);
            }}
          >
            {playing ? "Pausar" : "Reproduzir"}
          </Button>
          <Button variant="ghost" size="sm" icon="redo" aria-label="Próximo evento" disabled={atEnd} onClick={() => setIndex(index + 1)} />
          <input
            type="range"
            min={0}
            max={Math.max(events.length - 1, 0)}
            value={index}
            onChange={(e) => {
              setPlaying(false);
              setIndex(Number(e.target.value));
            }}
            aria-label="Momento do round"
            className={styles.slider}
          />
          <span className={styles.clock}>
            <Icon name="clock" size={16} />
            {current ? clock(current.tMs) : "0:00"}
          </span>
        </div>
        <p className={styles.caption}>
          Posições registradas a cada abate: o jogo não guarda o caminho entre eles. Quadrado com borda vermelha é ataque, ciano é defesa; X marca onde alguém morreu e o losango, a spike.
        </p>
      </div>

      <aside className={styles.right} aria-label="Chance de vitória e eventos">
        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={4} as="div">
            Chance de vitória
          </SectionLabel>
          {round ? <WinProbChart points={teamWinCurve(round, myTeamId)} nowMs={current?.tMs ?? null} teamName={view.mine.team.displayName} /> : null}
        </section>
        <section className={cx(styles.panel, "st-cut")}>
          <SectionLabel index={5} as="div">
            Eventos do round
          </SectionLabel>
          {replay.isPending ? (
            <p className={styles.help}>Carregando o replay.</p>
          ) : events.length ? (
            <ol className={styles.feed}>
              {events.map((e, i) => (
                <li key={i}>
                  <button type="button" className={cx(styles.event, i === index && styles.on)} aria-current={i === index ? "step" : undefined} onClick={() => setIndex(i)}>
                    <span className={styles.time}>{clock(e.tMs)}</span>
                    <span>{describe(e, replay.data?.players ?? [])}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.help}>Nenhum evento registrado neste round.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
