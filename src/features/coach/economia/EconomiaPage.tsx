import { useState, type CSSProperties } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { q, type TeamEconomy } from "../../../api";
import { useMe } from "../../../app/session";
import { cx } from "../../../design/cx";
import { Badge, SectionLabel, Select, Tooltip } from "../../../design/primitives";
import styles from "./EconomiaPage.module.css";

// Coach, Economia do time. Win rate por tipo de compra, a matriz "nossa compra contra a do adversário"
// e os hábitos de economia que custam rounds (flags do ETL).

type BuyType = TeamEconomy["byBuyType"][number]["buyType"];
type Flag = TeamEconomy["flags"][number];
type Side = "attack" | "defense";

/** Abaixo disso a célula da matriz fica esmaecida: pouco round para uma leitura confiável. */
const MIN_ROUNDS = 5;

const pct = (rate: number) => Math.round(rate * 100);
const fmt = (n: number, digits = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signedPp = (rate: number, base: number) => {
  const d = pct(rate) - pct(base);
  return `${d > 0 ? "+" : d < 0 ? "-" : ""}${Math.abs(d)} p.p.`;
};

const BUY_ORDER: BuyType[] = ["pistol", "eco", "semi_eco", "half_buy", "full_buy"];
const BUY: Record<BuyType, { label: string; help: string }> = {
  pistol: { label: "Pistol", help: "Pistol: primeiro round de cada metade, todos começam só com pistola." },
  eco: { label: "Eco", help: "Eco: o time quase não compra para juntar dinheiro para o próximo round." },
  semi_eco: { label: "Semi-eco", help: "Semi-eco: compra barata, com pistolas melhores ou SMGs e pouco escudo." },
  half_buy: { label: "Meia compra", help: "Meia compra: parte do time com rifle ou escudo, sem o equipamento completo." },
  full_buy: { label: "Compra completa", help: "Compra completa: rifle, escudo e habilidades para todo o time." },
};

/**
 * Hábitos conhecidos. O campo `flag` da API é texto livre: um valor que não estiver aqui
 * aparece com o nome técnico, em vez de sumir da tela.
 */
const FLAGS: Record<string, { title: string; what: string }> = {
  force_after_pistol_loss: {
    title: "Força a compra depois de perder o pistol",
    what: "No round 2, depois de perder o pistol, o time compra em vez de fazer eco.",
  },
  saved_with_high_bank: {
    title: "Guarda dinheiro com o banco alto",
    what: "Rounds em que havia dinheiro para comprar completo, mas a compra não saiu.",
  },
};
const flagInfo = (f: Flag) => FLAGS[f.flag] ?? { title: `Hábito de economia (${f.flag.replace(/_/g, " ")})`, what: "" };

/** Rounds perdidos a mais do que o esperado: ocorrências vezes a diferença entre o esperado e o real. */
const flagCost = (f: Flag) => f.count * (f.expectedWinRate - f.winRate);

/** Esperado de cada tipo de compra, ponderado pelos rounds contra cada compra do adversário. */
function expectedByBuy(economy: TeamEconomy) {
  const out = new Map<BuyType, number>();
  for (const b of BUY_ORDER) {
    const cells = economy.matrix.filter((c) => c.buyType === b);
    const rounds = cells.reduce((s, c) => s + c.rounds, 0);
    if (rounds) out.set(b, cells.reduce((s, c) => s + c.expectedWinRate * c.rounds, 0) / rounds);
  }
  return out;
}

/** Frase-resumo antes dos números: quanto rende a compra completa e o hábito que mais custa. */
function headline(economy: TeamEconomy) {
  const parts: string[] = [];
  const full = economy.byBuyType.find((b) => b.buyType === "full_buy");
  const eco = economy.byBuyType.find((b) => b.buyType === "eco");
  if (full) parts.push(`Com compra completa o time vence ${pct(full.winRate)}% dos rounds${eco ? `; no eco, ${pct(eco.winRate)}%` : ""}.`);
  const worst = [...economy.flags].sort((a, b) => flagCost(b) - flagCost(a))[0];
  if (worst && flagCost(worst) >= 0.5) {
    parts.push(`O hábito que mais custa: ${flagInfo(worst).title.toLowerCase()}, cerca de ${fmt(flagCost(worst), 1)} rounds perdidos.`);
  }
  return parts.join(" ") || "Ainda não há rounds suficientes para uma leitura da economia.";
}

/** Cor pela diferença para o esperado: ciano quando o time vence mais do que deveria, vermelho quando menos. */
function cellStyle(winRate: number, expected: number): CSSProperties {
  const d = winRate - expected;
  const strength = Math.min(1, Math.abs(d) / 0.2);
  const color = d >= 0 ? "var(--cyan)" : "var(--signal)";
  return { background: `color-mix(in srgb, ${color} ${Math.round(15 + strength * 60)}%, var(--ink-800))` };
}

export default function EconomiaPage() {
  const me = useMe();
  const teamId = me.team?.id;

  const [mapId, setMapId] = useState("");
  const [side, setSide] = useState<Side | "">("");
  const filtered = mapId !== "" || side !== "";
  const filters = { ...(mapId ? { map: Number(mapId) } : {}), ...(side ? { side } : {}) };

  const team = useQuery({ ...q.teams.get(teamId ?? 0), enabled: teamId != null });
  const economy = useQuery({
    ...q.teams.economy(teamId ?? 0, filtered ? filters : undefined),
    enabled: teamId != null,
    placeholderData: keepPreviousData,
  });

  if (teamId == null) return <p className={styles.state}>Sua conta ainda não está ligada a um time.</p>;
  if (economy.error) return <p className={styles.state}>{economy.error.message}</p>;
  if (economy.isPending) return <p className={styles.state}>Carregando a economia do time.</p>;

  const e = economy.data;
  const expected = expectedByBuy(e);
  const byBuy = BUY_ORDER.map((b) => e.byBuyType.find((x) => x.buyType === b)).filter((x) => x != null);
  const flags = [...e.flags].sort((a, b) => flagCost(b) - flagCost(a));
  const mapOptions = [
    { value: "", label: "Todos os mapas" },
    ...(team.data?.maps ?? []).map((m) => ({ value: String(m.map.id), label: `${m.map.name} (${m.matches} partidas)` })),
  ];

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
        <SectionLabel index={1}>Win rate por tipo de compra</SectionLabel>
        <p className={styles.headline}>{headline(e)}</p>
        <div className={cx(styles.panel, styles.bars, "st-cut")}>
          {byBuy.map((b) => {
            const exp = expected.get(b.buyType);
            return (
              <div key={b.buyType} className={styles.bar}>
                <div className={styles.barLabel}>
                  <Tooltip term={BUY[b.buyType].label}>{BUY[b.buyType].help}</Tooltip>
                  <span className={styles.note}>{fmt(b.rounds)} rounds</span>
                </div>
                <div
                  className={styles.track}
                  role="img"
                  aria-label={`${BUY[b.buyType].label}: ${pct(b.winRate)}% dos rounds vencidos${exp != null ? `, esperado ${pct(exp)}%` : ""}`}
                >
                  <span className={styles.fill} style={{ width: `${pct(b.winRate)}%` }} />
                  {exp != null ? <span className={styles.expected} style={{ left: `${pct(exp)}%` }} /> : null}
                </div>
                <div className={styles.barValue}>
                  <strong>{pct(b.winRate)}%</strong>
                  {exp != null ? (
                    <span className={cx(styles.note, b.winRate >= exp ? styles.up : styles.down)}>
                      {signedPp(b.winRate, exp)} contra {pct(exp)}% esperado
                    </span>
                  ) : null}
                </div>
                <span className={styles.note}>
                  Equipamento médio de {fmt(b.averageLoadout)} créditos, sobra de {fmt(b.averageBank)} no banco
                </span>
              </div>
            );
          })}
          <p className={styles.note}>
            A barra mostra os rounds vencidos e o traço marca o esperado, que leva em conta o que o adversário comprou em cada round.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel index={2}>Nossa compra contra a do adversário</SectionLabel>
        <div className={cx(styles.panel, "st-cut")}>
          <div className={styles.scroll}>
            <div className={styles.matrix} role="table" aria-label="Rounds vencidos por tipo de compra, nosso contra o do adversário">
              <div role="row" className={styles.row}>
                <span role="columnheader" className={styles.head}>
                  Nós / Adversário
                </span>
                {BUY_ORDER.map((b) => (
                  <span key={b} role="columnheader" className={styles.head}>
                    {BUY[b].label}
                  </span>
                ))}
              </div>
              {BUY_ORDER.map((ours) => (
                <div key={ours} role="row" className={styles.row}>
                  <span role="rowheader" className={styles.rowHead}>
                    {BUY[ours].label}
                  </span>
                  {BUY_ORDER.map((theirs) => {
                    const c = e.matrix.find((m) => m.buyType === ours && m.opponentBuy === theirs);
                    if (!c || !c.rounds) {
                      return (
                        <span key={theirs} role="cell" className={cx(styles.cell, styles.empty)}>
                          Sem rounds
                        </span>
                      );
                    }
                    return (
                      <span
                        key={theirs}
                        role="cell"
                        className={cx(styles.cell, c.rounds < MIN_ROUNDS && styles.low)}
                        style={cellStyle(c.winRate, c.expectedWinRate)}
                      >
                        <strong>{pct(c.winRate)}%</strong>
                        <span className={styles.cellNote}>
                          esperado {pct(c.expectedWinRate)}%, {c.rounds} rounds
                        </span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className={styles.note}>
            Cada linha é o que o time comprou; cada coluna, o que o adversário comprou no mesmo round. Ciano: o time vence mais do que o
            esperado. Vermelho: vence menos. Células com menos de {MIN_ROUNDS} rounds ficam esmaecidas.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel index={3}>Hábitos que custam rounds</SectionLabel>
        {flags.length ? (
          <div className={styles.cards}>
            {flags.map((f) => {
              const info = flagInfo(f);
              const cost = flagCost(f);
              return (
                <article key={`${f.flag}-${f.player?.id ?? "team"}`} className={cx(styles.panel, styles.card, "st-cut")}>
                  <div className={styles.badges}>
                    <Badge tone={cost >= 0.5 ? "alert" : "neutral"} icon="coin">
                      Economia
                    </Badge>
                    <Badge icon={f.scope === "player" ? "player" : "team"}>
                      {f.scope === "player" && f.player ? `${f.player.gameName}#${f.player.tagLine}` : "Time"}
                    </Badge>
                  </div>
                  <h3 className={styles.cardTitle}>{info.title}</h3>
                  {info.what ? <p className={styles.note}>{info.what}</p> : null}
                  <p className={styles.cardText}>
                    Aconteceu em {f.count} rounds. O time venceu {pct(f.winRate)}% deles, contra {pct(f.expectedWinRate)}% esperado.
                  </p>
                  <p className={styles.note}>
                    {cost >= 0.5
                      ? `Custou cerca de ${fmt(cost, 1)} rounds a mais do que o esperado.`
                      : "Não custou rounds: o resultado ficou dentro do esperado."}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className={styles.state}>Nenhum hábito de economia prejudicial neste filtro.</p>
        )}
      </section>
    </div>
  );
}
