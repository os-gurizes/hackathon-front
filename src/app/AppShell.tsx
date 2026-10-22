import type { ReactNode } from "react";
import { cx } from "../design/cx";
import { Badge, Icon } from "../design/primitives";
import { RIOT_DISCLAIMER } from "../copy/legal";
import styles from "./AppShell.module.css";

const COACH_TABS = [
  { id: "time", label: "Meu time" },
  { id: "partida", label: "Análise de partida" },
  { id: "prancheta", label: "Prancheta" },
  { id: "estrategias", label: "Estratégias" },
  { id: "elenco", label: "Elenco" },
  { id: "pressao", label: "Pressão e rotações" },
  { id: "combos", label: "Combos" },
  { id: "economia", label: "Economia do time" },
  { id: "scouting", label: "Scouting" },
  { id: "heatmap", label: "Heatmap" },
] as const;

type CoachTab = (typeof COACH_TABS)[number]["id"];

export function AppShell({ active, wide, children }: { active: CoachTab; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cx(styles.shell, wide && styles.wide)}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <a href="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true" />
            <span>Sala Tática</span>
          </a>
          <div className={styles.user}>
            <Icon name="team" size={20} />
            <span>Coach</span>
            <Badge tone="defense" icon={null}>
              Coach
            </Badge>
          </div>
        </div>
        <nav aria-label="Visão do coach" className={styles.nav}>
          {COACH_TABS.map((t) =>
            t.id === active ? (
              <a key={t.id} href="/" className={cx(styles.tab, styles.tabActive)} aria-current="page">
                {t.label}
              </a>
            ) : (
              <span key={t.id} className={cx(styles.tab, styles.tabOff)} title="Ainda não disponível">
                {t.label}
              </span>
            ),
          )}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>{RIOT_DISCLAIMER}</footer>
    </div>
  );
}
