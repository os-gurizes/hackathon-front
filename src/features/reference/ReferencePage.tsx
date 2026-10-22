import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Drawer,
  Icon,
  ICON_NAMES,
  SectionLabel,
  Select,
  Stat,
  Table,
  Tabs,
  Tooltip,
} from "../../design/primitives";
import { RIOT_DISCLAIMER } from "../../copy/legal";
import styles from "./ReferencePage.module.css";

const ROWS = [
  { id: "ascent", map: "Ascent", rounds: 212, win: "58%" },
  { id: "lotus", map: "Lotus", rounds: 164, win: "51%" },
  { id: "haven", map: "Haven", rounds: 98, win: "44%" },
];

function Showcase({ theme }: { theme: "dark" | "light" }) {
  const [drawer, setDrawer] = useState(false);
  return (
    <section data-theme={theme} className={styles.theme}>
      <h2 className={styles.themeTitle}>{theme === "dark" ? "Tema escuro: Sala tática" : "Tema claro: Briefing"}</h2>

      <SectionLabel index={1}>Botões</SectionLabel>
      <div className={styles.row}>
        <Button variant="primary" icon="share">
          Compartilhar
        </Button>
        <Button icon="save">Exportar PNG</Button>
        <Button variant="ghost" icon="layers">
          Duplicar
        </Button>
        <Button variant="primary" size="sm">
          Pequeno
        </Button>
        <Button variant="ghost" size="sm" icon="close" aria-label="Fechar" />
        <Button disabled>Desativado</Button>
      </div>

      <SectionLabel index={2}>Badges e tooltip</SectionLabel>
      <div className={styles.row}>
        <Badge>Neutro</Badge>
        <Badge tone="attack">Ataque</Badge>
        <Badge tone="defense">Defesa</Badge>
        <Badge tone="gold">Melhor</Badge>
        <Badge tone="ok">Positivo</Badge>
        <Badge tone="alert">Alerta</Badge>
        <Badge tone="estimate">Estimativa</Badge>
        <Tooltip term="K/D">Abates por morte. Acima de 1,0 significa que você abate mais do que morre.</Tooltip>
      </div>

      <SectionLabel index={3}>Cartões e números</SectionLabel>
      <div className={styles.grid}>
        <Card label="Visão geral" index={1} title="Ascent">
          <Stat
            label="K/D"
            help="Abates por morte. Acima de 1,0 significa que você abate mais do que morre."
            value="1,24"
            delta="+0,12"
            comparison="contra a sua média"
          />
        </Card>
        <Card title="Pós-plant" elevated>
          <Stat label="Vitórias" value="62" unit="%" delta="-4 p.p." comparison="contra o time" />
        </Card>
        <Card title="Habilidades">
          <Stat label="Abates com habilidade" value="0,8" estimate sample={3} minSample={5} comparison="por partida" />
        </Card>
      </div>

      <SectionLabel index={4}>Abas e seleção</SectionLabel>
      <Tabs
        label="Exemplo de abas"
        items={[
          { id: "a", label: "Meu desempenho", icon: "trend-up" },
          { id: "b", label: "Meus mapas", icon: "map" },
          { id: "c", label: "Armas", icon: "crosshair" },
        ]}
      />
      <div className={styles.row}>
        <Select
          label="Mapa"
          defaultValue="ascent"
          options={ROWS.map((r) => ({ value: r.id, label: r.map }))}
        />
        <Button onClick={() => setDrawer(true)} icon="layers">
          Abrir drawer
        </Button>
      </div>

      <SectionLabel index={5}>Tabela</SectionLabel>
      <Table
        caption="Rounds por mapa nas classificatórias"
        highlight="ascent"
        columns={[
          { key: "map", label: "Mapa" },
          { key: "rounds", label: "Rounds", numeric: true },
          { key: "win", label: "Vitórias", numeric: true },
        ]}
        rows={ROWS}
      />

      <SectionLabel index={6}>Ícones</SectionLabel>
      <ul className={styles.icons}>
        {ICON_NAMES.map((n) => (
          <li key={n}>
            <Icon name={n} />
            <span>{n}</span>
          </li>
        ))}
      </ul>

      <Drawer open={drawer} title="Zona B Site" onClose={() => setDrawer(false)} footer={<Button onClick={() => setDrawer(false)}>Fechar</Button>}>
        <p>Você morre 31% das vezes neste ponto quando entra sem trade.</p>
      </Drawer>
    </section>
  );
}

export function ReferencePage() {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Referência visual</h1>
        <a href="/">Voltar para a prancheta</a>
      </header>
      <div className={styles.themes}>
        <Showcase theme="dark" />
        <Showcase theme="light" />
      </div>
      <footer className={styles.footer}>{RIOT_DISCLAIMER}</footer>
    </div>
  );
}
