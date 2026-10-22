import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { SectionLabel } from "./SectionLabel";
import styles from "./Card.module.css";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  label?: ReactNode;
  index?: number;
  title?: ReactNode;
  actions?: ReactNode;
  elevated?: boolean;
}

export function Card({ title, label, index, elevated, actions, children, className, ...rest }: CardProps) {
  return (
    <section {...rest} className={cx(styles.card, "st-cut", elevated && styles.elevated, className)}>
      {label ? (
        <SectionLabel index={index} as="div">
          {label}
        </SectionLabel>
      ) : null}
      {title || actions ? (
        <header className={styles.head}>
          {title ? <h3 className={styles.title}>{title}</h3> : <span />}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
