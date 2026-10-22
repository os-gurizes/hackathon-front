import { useEffect, type ReactNode } from "react";
import { cx } from "../cx";
import { Button } from "./Button";
import styles from "./Drawer.module.css";

export interface DrawerProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  inline?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Drawer({ open, title, onClose, inline, children, footer, className }: DrawerProps) {
  useEffect(() => {
    if (!open || inline) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, inline, onClose]);

  if (!open) return null;

  const panel = (
    <aside
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-label={title}
      className={cx(styles.drawer, "st-cut", inline && styles.inline, className)}
    >
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <Button variant="ghost" size="sm" icon="close" aria-label="Fechar" onClick={onClose} />
      </header>
      <div className={styles.body}>{children}</div>
      {footer ? <footer className={styles.foot}>{footer}</footer> : null}
    </aside>
  );

  if (inline) return panel;
  return (
    <div className={styles.scrim} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      {panel}
    </div>
  );
}
