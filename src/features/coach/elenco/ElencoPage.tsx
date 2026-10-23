import { useQueries, useQuery } from "@tanstack/react-query";
import { q, type PlayerStats } from "../../../api";
import { linkHandler } from "../../../app/router";
import { SemTime } from "../../../app/SemTime";
import { useTeamScope } from "../../../app/teamScope";
import { cx } from "../../../design/cx";
import { Icon, SectionLabel, Table, Tooltip } from "../../../design/primitives";
import styles from "./ElencoPage.module.css";

// Coach, Elenco. Os jogadores do time lado a lado, cada número comparado à média do elenco.
// O nome abre a visão de player daquele jogador em modo leitura (/coach/jogador?id=).

type Totals = PlayerStats["overall"];
type Player = { id: number; gameName: string; tagLine: string };

/** Abaixo disso o jogador aparece esmaecido: pouca partida para comparar com o resto. */
const MIN_MATCHES = 5;

const pct = (rate: number) => Math.round(rate * 100);
const fmt = (n: number, digits = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (n: number, digits = 0) => {
  const r = Number(n.toFixed(digits));
  return `${r > 0 ? "+" : r < 0 ? "-" : ""}${fmt(Math.abs(r), digits)}`;
};
const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);

type Kpi = { id: string; label: string; help: string; get: (t: Totals) => number; rate?: boolean; digits?: number };

const KPIS: Kpi[] = [
  { id: "kd", label: "K/D", help: "K/D: abates por morte. Acima de 1,0 o jogador abate mais do que morre.", get: (t) => t.kd, digits: 2 },
  { id: "acs", label: "ACS", help: "ACS: pontuação média de combate por round. Soma dano, abates e assistências.", get: (t) => t.acs },
  { id: "adr", label: "ADR", help: "ADR: dano médio causado por round.", get: (t) => t.adr },
  { id: "kast", label: "KAST", help: "KAST: em quantos rounds o jogador abateu, deu assistência, sobreviveu ou foi trocado.", get: (t) => t.kast, rate: true },
  { id: "hs", label: "HS%", help: "HS%: parte dos tiros que acertam a cabeça.", get: (t) => t.headshotRate, rate: true },
  {
    id: "fk",
    label: "Abre rounds",
    help: "Primeiros abates do round a cada 10 rounds jogados. Mostra quem costuma abrir a jogada.",
    get: (t) => (t.rounds ? (t.firstKills / t.rounds) * 10 : 0),
    digits: 1,
  },
];

const show = (k: Kpi, t: Totals) => (k.rate ? `${pct(k.get(t))}%` : fmt(k.get(t), k.digits));
const diff = (k: Kpi, v: number, base: number) => (k.rate ? `${signed(pct(v) - pct(base))} p.p.` : signed(v - base, k.digits));

/** Frase-resumo antes da tabela: quem lidera e quem está mais abaixo no K/D, entre quem tem amostra. */
function headline(rows: Array<{ player: Player; stats: Totals }>) {
  const solid = rows.filter((r) => r.stats.matches >= MIN_MATCHES);
  if (solid.length < 2) return "Ainda não há partidas suficientes para comparar o elenco.";
  const byKd = [...solid].sort((a, b) => b.stats.kd - a.stats.kd);
  const top = byKd[0]!;
  const low = byKd[byKd.length - 1]!;
  const mean = avg(solid.map((r) => r.stats.kd));
  return `${top.player.gameName} tem o maior K/D do elenco (${fmt(top.stats.kd, 2)}). ${low.player.gameName} tem o menor (${fmt(low.stats.kd, 2)}), contra a média do time de ${fmt(mean, 2)}.`;
}

const playerLink = (id: number) => `/coach/jogador?id=${id}`;

export default function ElencoPage() {
  // Coach: o próprio time. Admin: o time em análise escolhido no topo
  const teamId = useTeamScope()?.id;

  const team = useQuery({ ...q.teams.get(teamId ?? 0), enabled: teamId != null });
  // O elenco mais recente vem primeiro; jogador repetido em mais de um campeonato aparece uma vez
  const roster = team.data?.rosters[0];
  const players = roster?.players.map((p) => p.player) ?? [];
  // Só as partidas pelo time: o jogador pode ter jogado por outro antes
  const stats = useQueries({ queries: players.map((p) => q.players.stats(p.id, { team: teamId })) });

  if (teamId == null) return <SemTime className={styles.state} />;
  if (team.error) return <p className={styles.state}>{team.error.message}</p>;
  if (team.isPending) return <p className={styles.state}>Carregando o elenco.</p>;
  if (!players.length) return <p className={styles.state}>O time ainda não tem jogadores registrados.</p>;

  const failed = stats.find((s) => s.error)?.error;
  const loading = stats.some((s) => s.isPending);
  const rows = players.flatMap((player, i) => {
    const s = stats[i]?.data;
    return s ? [{ id: player.id, player, stats: s.overall }] : [];
  });
  const solid = rows.filter((r) => r.stats.matches >= MIN_MATCHES);
  const means = new Map(KPIS.map((k) => [k.id, avg(solid.map((r) => k.get(r.stats)))]));
  // Melhor de cada coluna, comparando o número como aparece na tela. Empate no topo não tem troféu
  const bests = new Map(
    KPIS.map((k) => {
      const shown = solid.map((r) => show(k, r.stats));
      const top = [...solid].sort((a, b) => k.get(b.stats) - k.get(a.stats))[0];
      const unique = top && shown.filter((v) => v === show(k, top.stats)).length === 1;
      return [k.id, unique ? top.id : null];
    }),
  );

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <SectionLabel index={1}>Elenco lado a lado</SectionLabel>
        <p className={styles.headline}>{loading ? "Carregando os números do elenco." : headline(rows)}</p>
        {failed ? <p className={styles.state}>{failed.message}</p> : null}
        {rows.length ? (
          <div className={cx(styles.panel, "st-cut")}>
            <div className={styles.scroll}>
              <Table
                caption={roster ? `Partidas pelo time em ${roster.tournament.name}` : undefined}
                rows={rows}
                columns={[
                  {
                    key: "player",
                    label: "Jogador",
                    render: (r) => (
                      <a href={playerLink(r.id)} onClick={linkHandler(playerLink(r.id))} className={styles.player}>
                        <Icon name="player" size={16} />
                        <span>
                          {r.player.gameName}
                          <span className={styles.tag}>#{r.player.tagLine}</span>
                        </span>
                      </a>
                    ),
                  },
                  {
                    key: "matches",
                    label: "Partidas",
                    numeric: true,
                    render: (r) => `${r.stats.matches}${r.stats.matches < MIN_MATCHES ? " (pouco)" : ""}`,
                  },
                  ...KPIS.map((k) => ({
                    key: k.id,
                    label: <Tooltip term={k.label}>{k.help}</Tooltip>,
                    numeric: true,
                    render: (r: (typeof rows)[number]) => {
                      const v = k.get(r.stats);
                      const low = r.stats.matches < MIN_MATCHES;
                      const mean = means.get(k.id) ?? v;
                      const best = bests.get(k.id) === r.id;
                      const d = Number((k.rate ? pct(v) - pct(mean) : v - mean).toFixed(k.digits ?? 0));
                      return (
                        <span className={cx(styles.value, low && styles.low)}>
                          <span className={cx(styles.number, best && styles.best)}>
                            {best ? <Icon name="trophy" size={14} /> : null}
                            {show(k, r.stats)}
                          </span>
                          {low ? null : (
                            <span className={cx(styles.delta, d > 0 ? styles.up : d < 0 ? styles.down : undefined)}>
                              {diff(k, v, mean)}
                            </span>
                          )}
                        </span>
                      );
                    },
                  })),
                ]}
              />
            </div>
            <p className={styles.note}>
              Embaixo de cada número, a diferença para a média do elenco. O troféu marca o melhor do time em cada coluna. Jogadores com
              menos de {MIN_MATCHES} partidas ficam esmaecidos e fora da média. Clique no nome para ver a tela do jogador.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
