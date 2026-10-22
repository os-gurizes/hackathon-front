import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cx } from "../cx";
import { Icon } from "./Icon";
import styles from "./Select.module.css";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: ReactNode;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}

export function Select({ label, options, onChange, id, className, ...rest }: SelectProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cx(styles.select, className)}>
      {label ? (
        <label className={styles.label} htmlFor={fid}>
          {label}
        </label>
      ) : null}
      <div className={cx(styles.box, "st-cut")}>
        <select id={fid} onChange={(e) => onChange?.(e.target.value)} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron" size={16} className={styles.chev} />
      </div>
    </div>
  );
}
