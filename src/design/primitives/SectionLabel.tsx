import type { ReactNode } from "react";
import { cx } from "../cx";
import styles from "./SectionLabel.module.css";

export interface SectionLabelProps {
  index?: number;
  as?: "h2" | "h3" | "div";
  className?: string;
  children: ReactNode;
}

export function SectionLabel({ index, as: Tag = "h2", className, children }: SectionLabelProps) {
  const num = index == null ? null : String(index).padStart(2, "0");
  return (
    <Tag className={cx(styles.section, className)}>
      <span className={styles.mark} aria-hidden="true" />
      {num ? <span className={styles.num}>{num}</span> : null}
      <span>{children}</span>
      <span className={styles.rule} aria-hidden="true" />
    </Tag>
  );
}
