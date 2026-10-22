import { useRef, useState, type KeyboardEvent } from "react";
import { cx } from "../cx";
import { Icon, type IconName } from "./Icon";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  label?: string;
  className?: string;
}

export function Tabs({ items, value, defaultValue, onChange, label, className }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id);
  const current = value ?? inner;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const last = items.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    const item = next == null ? undefined : items[next];
    if (next == null || !item) return;
    e.preventDefault();
    select(item.id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={cx(styles.tabs, className)}>
      {items.map((t, i) => {
        const on = t.id === current;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className={cx(styles.tab, on && styles.active)}
            onClick={() => select(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.icon ? <Icon name={t.icon} size={16} /> : null}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
