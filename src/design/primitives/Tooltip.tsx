import { useId, useState, type ReactNode } from "react";
import { cx } from "../cx";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  term: ReactNode;
  children: ReactNode;
  placement?: "top" | "bottom";
  open?: boolean;
  className?: string;
}

export function Tooltip({ term, children, open, placement = "top", className }: TooltipProps) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <span className={cx(styles.tip, className)} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button
        type="button"
        className={styles.term}
        aria-describedby={id}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setShow(false);
        }}
      >
        {term}
      </button>
      <span id={id} role="tooltip" className={cx(styles.bubble, styles[placement], (open || show) && styles.open)}>
        {children}
      </span>
    </span>
  );
}
