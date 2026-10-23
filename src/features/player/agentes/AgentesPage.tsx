import { useQuery } from "@tanstack/react-query";
import { q, type PlayerAbilities, type PlayerAgents } from "../../../api";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { Badge, SectionLabel, Stat, Table, Tooltip } from "../../../design/primitives";
import { AGENTS, assetUrl } from "../../../map/mapData";
import { diff, fmt, MIN_MATCHES, pct, tone } from "../shared";
import styles from "../player.module.css";

type AgentRow = PlayerAgents[number];
type AbilityKill = PlayerAbilities["abilityKills"][number];

const iconOf = (name: string) => AGENTS.find((a) => a.name.toLowerCase() === name.toLowerCase())?.icon;

const SLOT: Record<string, string> = { Ability1: "Habilidade 1", Ability2: "Habilidade 2", Grenade: "Habilidade de assinatura", Ultimate: "Ultimate" };
const slotLabel = (k: AbilityKill) => k.abilityName ?? SLOT[k.slot] ?? k.slot;

function insightFor(list: AgentRow[]): string {
  const main = [...list].sort((a, b) => b.stats.matches - a.stats.matches)[0]!;
  const base = main.baselineAcs;
  const comp =
    base == null
      ? ""
      : Math.abs(main.stats.acs - base) < 10
        ? ", na média de quem joga com ele"
        : `, ${fmt(Math.abs(main.stats.acs - base))} ${main.stats.acs > base ? "acima" : "abaixo"} da média de quem joga com ele`;
  return `${main.agent.name} é o seu agente principal: ${main.stats.matches} partidas, ACS ${fmt(main.stats.acs)}${comp}. Você vence ${pct(main.stats.roundWinRate)} dos rounds com ele.`;
}

function AgentCard({ a }: { a: AgentRow }) {
  const icon = iconOf(a.agent.name);
  const low = a.stats.matches < MIN_MATCHES;
  return (
    <article className={cx(styles.panel, "st-cut", low && styles.low)}>
      <div className={styles.panelHead}>
        {icon ? <img src={assetUrl(icon)} alt="" width={56} height={56} /> : null}
        <div>
          <h3 className={styles.title}>{a.agent.name}</h3>
          <p className={styles.sub}>
            {a.agent.role ? `${a.agent.role}, ` : ""}
            {a.stats.matches} {a.stats.matches === 1 ? "partida" : "partidas"}, {a.stats.rounds} rounds
          </p>
        </div>
      </div>
      {low ? <p className={styles.help}>Amostra pequena: menos de {MIN_MATCHES} partidas, leia com cuidado.</p> : null}
      <div className={styles.stats}>
        <Stat
          label={<Tooltip term="ACS">ACS: pontuação média de combate por round. Soma dano, abates e assistências.</Tooltip>}
          value={fmt(a.stats.acs)}
          {...(a.baselineAcs != null
            ? { delta: diff(a.stats.acs, a.baselineAcs, 0), deltaTone: tone(a.stats.acs, a.baselineAcs, 10), comparison: "contra a média do agente" }
            : {})}
        />
        <Stat label="K/D" value={fmt(a.stats.kd, 2)} comparison={`${a.stats.kills} abates, ${a.stats.deaths} mortes`} />
        <Stat
          label={<Tooltip term="KAST">KAST: porcentagem dos rounds em que você abateu, deu assistência, sobreviveu ou foi trocado.</Tooltip>}
          value={fmt(a.stats.kast * 100)}
          unit="%"
        />
        <Stat label="Vitória nos rounds" value={fmt(a.stats.roundWinRate * 100)} unit="%" />
      </div>
      <p className={styles.note}>
        Primeiro abate em {a.stats.firstKills} rounds, primeira morte em {a.stats.firstDeaths}. Clutch: {a.stats.clutchWins} de {a.stats.clutchAttempts}.
      </p>
    </article>
  );
}

function Abilities({ data }: { data: PlayerAbilities }) {
  const kills = [...data.abilityKills].sort((a, b) => b.kills - a.kills);
  const u = data.usage;
  return (
    <section className={styles.section}>
      <SectionLabel index={3}>Habilidades</SectionLabel>
      <div className={styles.badges}>{data.isEstimate ? <Badge tone="estimate">Estimativa</Badge> : null}</div>
      <p className={styles.lead}>
        Você usa {fmt(u.castsPerRound, 1)} habilidades por round. A ultimate saiu {u.ultimateCasts} vezes e rendeu {u.ultimateKills} abates, {u.ultimateKillsInDecidedRounds} deles em rounds que decidiram o placar.
        {u.likelyOveruseMatches > 0 ? ` Em ${u.likelyOveruseMatches} de ${u.matches} partidas, o gasto de habilidades ficou bem acima do normal.` : ""}
      </p>
      {kills.length ? (
        <div className={styles.tableWrap}>
          <Table
            caption={
              <>
                Abates feitos com habilidade. A última coluna mostra quanto cada abate, em média, aumentou a{" "}
                <Tooltip term="chance de vitória">Chance de vitória do round estimada a partir de jogadores vivos, tempo e spike.</Tooltip> do seu time.
              </>
            }
            columns={[
              { key: "agente", label: "Agente", render: (k: AbilityKill & { id: string }) => k.agent.name },
              { key: "hab", label: "Habilidade", render: (k) => slotLabel(k) },
              { key: "kills", label: "Abates", numeric: true, render: (k) => fmt(k.kills) },
              { key: "wp", label: "Ganho por abate", numeric: true, render: (k) => `${k.averageWpGain > 0 ? "+" : ""}${fmt(k.averageWpGain * 100, 1)} p.p.` },
            ]}
            rows={kills.map((k) => ({ ...k, id: `${k.agent.id}-${k.slot}` }))}
          />
        </div>
      ) : (
        <p className={styles.help}>Nenhum abate com habilidade registrado.</p>
      )}
      {data.isEstimate ? <p className={styles.note}>Os dados de partida não dizem quando cada habilidade foi usada; estes números são estimados pelos abates e pelo saldo de economia.</p> : null}
    </section>
  );
}

export default function AgentesPage() {
  const me = useMe();
  const playerId = me.player?.id;
  const agents = useQuery({ ...q.players.agents(playerId ?? 0), enabled: playerId != null });
  const abilities = useQuery({ ...q.players.abilities(playerId ?? 0), enabled: playerId != null });

  if (playerId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um jogador. Peça ao admin para vincular.</p>;
  if (agents.error) return <p className={styles.state}>{agents.error.message}</p>;
  if (agents.isPending) return <p className={styles.state}>Carregando seus agentes.</p>;
  if (!agents.data.length) return <p className={styles.state}>Nenhuma partida registrada ainda.</p>;

  const list = [...agents.data].sort((a, b) => b.stats.matches - a.stats.matches);

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <SectionLabel index={1}>Agentes</SectionLabel>
        <p className={styles.insight}>{insightFor(list)}</p>
      </section>
      <section className={styles.section}>
        <SectionLabel index={2}>Por agente</SectionLabel>
        <div className={styles.grid}>
          {list.map((a) => (
            <AgentCard key={a.agent.id} a={a} />
          ))}
        </div>
      </section>
      {abilities.data ? <Abilities data={abilities.data} /> : abilities.error ? <p className={styles.state}>{abilities.error.message}</p> : null}
    </div>
  );
}
