import { useState, type ReactNode } from "react";
import type { Me } from "../api";
import { cx } from "../design/cx";
import { Badge, Button, Icon } from "../design/primitives";
import { RIOT_DISCLAIMER } from "../copy/legal";
import { linkHandler } from "./router";
import type { Tab } from "./routes";
import { displayName, roleLabel } from "./session";
import { Glossario } from "./Glossario";
import { AdminTeamPicker } from "./AdminTeamPicker";
import { Tour } from "./Tour";
import { tourVisto } from "./tourState";
import styles from "./AppShell.module.css";

type Props = {
  me: Me;
  tabs: Tab[];
  path: string;
  wide?: boolean;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({ me, tabs, path, wide, onLogout, children }: Props) {
  const isPlayer = me.role === "player";
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  // Primeiro acesso de cada papel abre o tour; depois, só pelo botão "Como usar"
  const [tourOpen, setTourOpen] = useState(() => !tourVisto(me.role));
  return (
    <div className={cx(styles.shell, wide && styles.wide)}>
      <Glossario open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
      <Tour role={me.role} open={tourOpen} onClose={() => setTourOpen(false)} />
      <header className={styles.header}>
        <div className={styles.bar}>
          <a href="/" className={styles.brand} onClick={linkHandler("/")}>
            <span className={styles.brandMark} aria-hidden="true" />
            <span>Sala Tática</span>
          </a>
          <div className={styles.user}>
            {me.role === "admin" ? <AdminTeamPicker /> : null}
            <Icon name={isPlayer ? "player" : "team"} size={20} />
            <span>{displayName(me)}</span>
            <Badge tone={isPlayer ? "neutral" : "defense"} icon={null}>
              {roleLabel[me.role]}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setTourOpen(true)}>
              Como usar
            </Button>
            <Button variant="ghost" size="sm" icon="playbook" onClick={() => setGlossaryOpen(true)}>
              Glossário
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Sair
            </Button>
          </div>
        </div>
        <nav aria-label={isPlayer ? "Visão do player" : "Visão do coach"} className={styles.nav}>
          {tabs.map((t) =>
            t.path ? (
              <a
                key={t.label}
                href={t.path}
                onClick={linkHandler(t.path)}
                className={cx(styles.tab, t.path === path && styles.tabActive)}
                aria-current={t.path === path ? "page" : undefined}
              >
                {t.label}
              </a>
            ) : (
              <span key={t.label} className={cx(styles.tab, styles.tabOff)} title="Em breve">
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
