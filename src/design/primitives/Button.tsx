import type { ButtonHTMLAttributes } from "react";
import { cx } from "../cx";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  icon?: IconName;
}

export function Button({ variant = "secondary", size = "md", icon, children, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        styles.btn,
        "st-cut",
        styles[variant],
        size === "sm" && styles.sm,
        icon && children == null && styles.iconOnly,
        className,
      )}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} /> : null}
      {children != null ? <span>{children}</span> : null}
    </button>
  );
}
