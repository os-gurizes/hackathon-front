import type { SVGProps } from "react";
import { cx } from "../cx";
import { ICONS, type IconName, type IconPart } from "./icons";
import styles from "./Icon.module.css";

export type { IconName };

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  title?: string;
}

export function Icon({ name, size = 24, title, className, ...rest }: IconProps) {
  const parts: IconPart[] = ICONS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={cx(styles.icon, className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {parts.map(([k, d], i) =>
        k === "f" ? <path key={i} d={d} fill="currentColor" stroke="none" /> : <path key={i} d={d} />,
      )}
    </svg>
  );
}
