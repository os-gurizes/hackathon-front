import { useState } from "react";
import { cx } from "../../../design/cx";
import { Icon } from "../../../design/primitives";
import { assetUrl, findAgent, findWeapon, QUICK_WEAPONS, WEAPONS, type Point, type WeaponInfo } from "../../../map/mapData";
import type { AgentItem, Side } from "../playbook/types";
import styles from "./AgentPopover.module.css";

const WIDTH = 304;

type Props = {
  item: AgentItem;
  anchor: Point;
  frameSize: number;
  fullSides: Side[];
  onSide: (side: Side) => void;
  onAbility: (abilityId: string) => void;
  onWeapon: (weaponId: string | null) => void;
  onRemove: () => void;
  onClose: () => void;
};

const byCategory = (weapons: WeaponInfo[]) =>
  weapons.reduce<Array<{ category: string; weapons: WeaponInfo[] }>>((groups, w) => {
    const g = groups.find((x) => x.category === w.category);
    if (g) g.weapons.push(w);
    else groups.push({ category: w.category, weapons: [w] });
    return groups;
  }, []);

/** Menu do agente no mapa: lado, habilidades que nascem perto dele, arma e remover. */
export function AgentPopover({ item, anchor, frameSize, fullSides, onSide, onAbility, onWeapon, onRemove, onClose }: Props) {
  const [allWeapons, setAllWeapons] = useState(false);
  const agent = findAgent(item.agentId);
  if (!agent) return null;

  const weapon = findWeapon(item.weaponId);
  const abilityWeapons = agent.abilities.filter((h) => h.isWeapon);
  const weaponName = weapon?.name ?? abilityWeapons.find((h) => h.id === item.weaponId)?.name;
  // Perto da borda de cima, o menu abre para baixo do agente
  const below = anchor.y < frameSize * 0.45;
  const left = Math.max(WIDTH / 2 + 8, Math.min(frameSize - WIDTH / 2 - 8, anchor.x));

  return (
    <div
      role="dialog"
      aria-label={`Opções de ${agent.name}`}
      className={cx(styles.popover, "st-cut", below ? styles.below : styles.above)}
      style={{ left, top: anchor.y, width: WIDTH }}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <header className={styles.head}>
        <img src={assetUrl(agent.icon)} alt="" width={28} height={28} />
        <strong className={styles.name}>{agent.name}</strong>
        <button type="button" className={styles.close} aria-label="Fechar" title="Fechar" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      </header>

      <div role="group" aria-label="Lado" className={styles.sides}>
        {(["attack", "defense"] as const).map((s) => {
          const full = fullSides.includes(s) && item.side !== s;
          return (
            <button
              key={s}
              type="button"
              className={cx(styles.side, item.side === s && styles.sideOn)}
              aria-pressed={item.side === s}
              disabled={full}
              title={full ? `${s === "attack" ? "Ataque" : "Defesa"} já tem 5 agentes` : undefined}
              onClick={() => onSide(s)}
            >
              <Icon name={s} size={16} className={s === "attack" ? styles.attack : styles.defense} />
              {s === "attack" ? "Ataque" : "Defesa"}
            </button>
          );
        })}
      </div>

      <section className={styles.section}>
        <span className={styles.label}>Habilidades: clique para pôr perto do agente</span>
        <div className={styles.row}>
          {agent.abilities.map((h) => (
            <button key={h.id} type="button" className={styles.icon} title={h.name} aria-label={h.name} onClick={() => onAbility(h.id)}>
              <img src={assetUrl(h.icon)} alt="" width={24} height={24} />
              <kbd>{h.key}</kbd>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Arma{weaponName ? `: ${weaponName}` : ""}</span>
        <div className={styles.row}>
          <button
            type="button"
            className={cx(styles.icon, !item.weaponId && styles.iconOn)}
            aria-pressed={!item.weaponId}
            title="Sem arma"
            onClick={() => onWeapon(null)}
          >
            <small>Nenhuma</small>
          </button>
          {abilityWeapons.map((h) => (
            <button
              key={h.id}
              type="button"
              className={cx(styles.icon, item.weaponId === h.id && styles.iconOn)}
              aria-pressed={item.weaponId === h.id}
              title={`${h.name} (habilidade ${h.key})`}
              aria-label={h.name}
              onClick={() => onWeapon(h.id)}
            >
              <img src={assetUrl(h.icon)} alt="" width={24} height={24} />
            </button>
          ))}
          {QUICK_WEAPONS.map((w) => (
            <WeaponButton key={w.id} weapon={w} on={item.weaponId === w.id} onClick={() => onWeapon(w.id)} />
          ))}
          <button type="button" className={cx(styles.icon, styles.more)} aria-expanded={allWeapons} onClick={() => setAllWeapons(!allWeapons)}>
            <small>{allWeapons ? "Menos" : "Todas"}</small>
          </button>
        </div>
        {allWeapons ? (
          <div className={styles.all}>
            {byCategory(WEAPONS).map((g) => (
              <div key={g.category}>
                <span className={styles.label}>{g.category}</span>
                <div className={styles.row}>
                  {g.weapons.map((w) => (
                    <WeaponButton key={w.id} weapon={w} on={item.weaponId === w.id} onClick={() => onWeapon(w.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <button type="button" className={styles.remove} onClick={onRemove}>
        <Icon name="eraser" size={16} />
        Remover {agent.name} do mapa
      </button>
    </div>
  );
}

function WeaponButton({ weapon, on, onClick }: { weapon: WeaponInfo; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cx(styles.icon, styles.weapon, on && styles.iconOn)}
      aria-pressed={on}
      aria-label={weapon.name}
      title={`${weapon.name} · ${weapon.cost.toLocaleString("pt-BR")} créditos`}
      onClick={onClick}
    >
      <img src={assetUrl(weapon.icon)} alt="" width={48} height={12} />
    </button>
  );
}
