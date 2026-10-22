import type { ReactNode } from "react";
import { cx } from "../cx";
import { Badge } from "./Badge";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";
import styles from "./Stat.module.css";

export interface StatProps {
  label: ReactNode;
  help?: ReactNode;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  comparison?: ReactNode;
  estimate?: boolean;
  sample?: number;
  minSample?: number;
  className?: string;
}

export function Stat({ label, help, value, unit, delta, deltaTone, comparison, sample, minSample, estimate, className }: StatProps) {
  const low = sample != null && minSample != null && sample < minSample;
  const tone = deltaTone ?? (delta == null ? "neutral" : delta.trim().startsWith("-") ? "down" : "up");
  return (
    <div className={cx(styles.stat, low && styles.low, className)}>
      <div className={styles.label}>
        {help ? <Tooltip term={label}>{help}</Tooltip> : <span>{label}</span>}
        {estimate ? <Badge tone="estimate">Estimativa</Badge> : null}
      </div>
      <div className={styles.value}>
        {value}
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </div>
      {delta != null || comparison ? (
        <div className={cx(styles.cmp, styles[tone])}>
          {delta != null && tone !== "neutral" ? <Icon name={tone === "down" ? "trend-down" : "trend-up"} size={16} /> : null}
          {delta != null ? <strong>{delta}</strong> : null}
          {comparison ? <span>{comparison}</span> : null}
        </div>
      ) : null}
      {low ? (
        <div className={styles.sample}>
          Amostra pequena: {sample} de {minSample} partidas necessárias.
        </div>
      ) : null}
    </div>
  );
}
