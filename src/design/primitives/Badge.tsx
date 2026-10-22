import type { ReactNode } from "react";
import { cx } from "../cx";
import { Icon, type IconName } from "./Icon";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "attack" | "defense" | "estimate" | "gold" | "ok" | "alert";

const BADGE_ICON: Partial<Record<BadgeTone, IconName>> = { attack: "attack", defense: "defense", gold: "trophy" };

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName | null;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", icon, className, children }: BadgeProps) {
  const ic = icon !== undefined ? icon : BADGE_ICON[tone];
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {ic ? <Icon name={ic} size={14} /> : null}
      <span>{children}</span>
    </span>
  );
}
