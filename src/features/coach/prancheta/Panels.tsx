import { cx } from "../../../design/cx";
import { Button, Icon, SectionLabel, Select } from "../../../design/primitives";
import { AGENTS, assetUrl, MAPS, ROLES } from "../../../map/mapData";
import { PHASES, type Background, type Phase, type Playbook, type Side } from "../playbook/types";
import { PHASE_INFO } from "./tools";
import styles from "./Panels.module.css";

export function PhasesPanel({
  playbook,
  activePhase,
  presenting,
  onPick,
  onToggle,
  onPresent,
  onClear,
}: {
  playbook: Playbook;
  activePhase: Phase;
  presenting: number | null;
  onPick: (p: Phase) => void;
  onToggle: (p: Phase) => void;
  onPresent: () => void;
  onClear: () => void;
}) {
  const count = (p: Phase) => playbook.items.filter((i) => i.phase === p).length;
  return (
    <section className={cx(styles.panel, "st-cut")} aria-labelledby="fases">
      <SectionLabel index={1} as="div">
        <span id="fases">Fases</span>
      </SectionLabel>
      {PHASES.map((p) => {
        const visible = playbook.visiblePhases.includes(p);
        const shown = presenting != null ? PHASES[presenting] === p : activePhase === p;
        const n = count(p);
        return (
          <div key={p} className={styles.phaseRow}>
            <button type="button" className={cx(styles.option, shown && styles.optionOn)} aria-pressed={activePhase === p} onClick={() => onPick(p)}>
              <span className={styles.swatch} style={{ background: `var(${PHASE_INFO[p].cssVar})` }} />
              <span className={styles.grow}>{PHASE_INFO[p].name}</span>
              <span className={styles.count}>{n === 1 ? "1 item" : `${n} itens`}</span>
            </button>
            <button
              type="button"
              className={cx(styles.eye, visible && styles.eyeOn)}
              aria-label={(visible ? "Esconder " : "Mostrar ") + PHASE_INFO[p].name}
              title={(visible ? "Esconder " : "Mostrar ") + PHASE_INFO[p].name}
              aria-pressed={visible}
              onClick={() => onToggle(p)}
            >
              <Icon name={visible ? "eye" : "eye-off"} size={16} />
            </button>
          </div>
        );
      })}
      <div className={styles.row}>
        <Button variant="secondary" size="sm" icon={presenting != null ? "pause" : "play"} onClick={onPresent}>
          {presenting != null ? "Parar" : "Apresentar fases"}
        </Button>
        <Button variant="ghost" size="sm" icon="eraser" onClick={onClear} disabled={!count(activePhase)}>
          Limpar {PHASE_INFO[activePhase].name}
        </Button>
      </div>
    </section>
  );
}

export function PiecesPanel({
  agentId,
  abilityId,
  onAgent,
  onAbility,
}: {
  agentId: string;
  abilityId: string | null;
  onAgent: (id: string) => void;
  onAbility: (id: string) => void;
}) {
  const agent = AGENTS.find((a) => a.id === agentId);
  return (
    <section className={cx(styles.panel, "st-cut")} aria-labelledby="pecas">
      <SectionLabel index={4} as="div">
        <span id="pecas">Agentes e habilidades</span>
      </SectionLabel>
      {ROLES.map((role) => (
        <div key={role} className={styles.roleGroup}>
          <span className={styles.roleName}>{role}</span>
          <div className={styles.agents}>
            {AGENTS.filter((a) => a.role === role).map((a) => (
              <button
                key={a.id}
                type="button"
                className={cx(styles.agent, a.id === agentId && styles.agentOn)}
                aria-label={a.name}
                title={a.name}
                aria-pressed={a.id === agentId}
                onClick={() => onAgent(a.id)}
              >
                <img src={assetUrl(a.icon)} alt="" width={32} height={32} />
              </button>
            ))}
          </div>
        </div>
      ))}
      {agent ? (
        <div className={styles.abilities} role="group" aria-label={`Habilidades de ${agent.name}`}>
          {agent.abilities.map((h) => (
            <button
              key={h.id}
              type="button"
              className={cx(styles.ability, h.id === abilityId && styles.abilityOn)}
              aria-pressed={h.id === abilityId}
              onClick={() => onAbility(h.id)}
              title={h.shape ? `${h.name}: desenha o alcance aproximado` : h.name}
            >
              <img src={assetUrl(h.icon)} alt="" width={24} height={24} />
              <span className={styles.key}>{h.key}</span>
              <span className={styles.abilityName}>{h.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function MapPanel({
  playbook,
  onMap,
  onSide,
  onBackground,
}: {
  playbook: Playbook;
  onMap: (id: string) => void;
  onSide: (s: Side) => void;
  onBackground: (b: Background) => void;
}) {
  const backgrounds: { id: Background; label: string }[] = [
    { id: "minimap", label: "Só o minimapa" },
    { id: "callouts", label: "Minimapa com callouts" },
  ];
  return (
    <section className={cx(styles.panel, "st-cut")} aria-labelledby="mapa">
      <SectionLabel index={2} as="div">
        <span id="mapa">Mapa e fundo</span>
      </SectionLabel>
      <Select
        label="Mapa"
        value={playbook.mapId}
        options={MAPS.map((m) => ({ value: m.id, label: m.name }))}
        onChange={onMap}
      />
      {playbook.items.length ? <p className={styles.hint}>Trocar de mapa limpa os desenhos. Dá para desfazer.</p> : null}
      <div role="group" aria-label="Lado" className={styles.sides}>
        {(["attack", "defense"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={cx(styles.option, playbook.side === s && styles.optionOn)}
            aria-pressed={playbook.side === s}
            onClick={() => onSide(s)}
          >
            <Icon name={s} size={16} className={s === "attack" ? styles.attack : styles.defense} />
            <span>{s === "attack" ? "Ataque" : "Defesa"}</span>
          </button>
        ))}
      </div>
      <div role="group" aria-label="Fundo do mapa" className={styles.stack}>
        {backgrounds.map((b) => (
          <button
            key={b.id}
            type="button"
            className={cx(styles.option, playbook.background === b.id && styles.optionOn)}
            aria-pressed={playbook.background === b.id}
            onClick={() => onBackground(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function NotesPanel({ phase, value, onChange }: { phase: Phase; value: string; onChange: (v: string) => void }) {
  return (
    <section className={cx(styles.panel, "st-cut")}>
      <SectionLabel index={3} as="div">
        <label htmlFor="phase-notes">Notas da fase: {PHASE_INFO[phase].name}</label>
      </SectionLabel>
      <textarea
        id="phase-notes"
        className={styles.notes}
        rows={4}
        maxLength={600}
        value={value}
        placeholder="O que cada um faz nesta fase."
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
