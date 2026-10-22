// Sala Tática: tipos dos primitives (documentação). Global: window.SalaTatica. Requer React 18 ou superior.
import type { ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes } from "react";

export type IconName =
  | "crosshair" | "skull" | "target" | "spike" | "defuse" | "shield" | "coin" | "clock"
  | "route" | "zone" | "heatmap" | "attack" | "defense" | "clutch"
  | "alert" | "trend-up" | "trend-down" | "filter" | "map" | "player" | "team" | "trophy"
  | "playbook" | "pencil" | "eraser" | "arrow" | "layers" | "save" | "share" | "play" | "pause"
  | "close" | "chevron";

export interface IconProps { name: IconName; size?: number; title?: string; className?: string; }
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  icon?: IconName;
}
export interface SectionLabelProps { index?: number; as?: "h2" | "h3" | "div"; children: ReactNode; }
export interface CardProps { label?: ReactNode; index?: number; title?: ReactNode; actions?: ReactNode; elevated?: boolean; children?: ReactNode; }
export interface BadgeProps { tone?: "neutral" | "attack" | "defense" | "estimate" | "gold" | "ok" | "alert"; icon?: IconName | null; children: ReactNode; }
export interface TooltipProps { term: ReactNode; children: ReactNode; placement?: "top" | "bottom"; open?: boolean; }
export interface StatProps {
  label: ReactNode; help?: ReactNode; value: string; unit?: string;
  delta?: string; deltaTone?: "up" | "down" | "neutral"; comparison?: ReactNode;
  estimate?: boolean; sample?: number; minSample?: number;
}
export interface TabItem { id: string; label: string; icon?: IconName; }
export interface TabsProps { items: TabItem[]; value?: string; defaultValue?: string; onChange?: (id: string) => void; label?: string; }
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: ReactNode; options: { value: string; label: string }[]; onChange?: (value: string) => void;
}
export interface TableColumn<R = any> { key: string; label: ReactNode; numeric?: boolean; render?: (row: R) => ReactNode; }
export interface TableProps<R = any> { columns: TableColumn<R>[]; rows: R[]; caption?: ReactNode; highlight?: string | number; }
export interface DrawerProps { open: boolean; title: string; onClose?: () => void; inline?: boolean; footer?: ReactNode; children?: ReactNode; }

export declare function Icon(p: IconProps): JSX.Element;
export declare function Button(p: ButtonProps): JSX.Element;
export declare function SectionLabel(p: SectionLabelProps): JSX.Element;
export declare function Card(p: CardProps): JSX.Element;
export declare function Badge(p: BadgeProps): JSX.Element;
export declare function Tooltip(p: TooltipProps): JSX.Element;
export declare function Stat(p: StatProps): JSX.Element;
export declare function Tabs(p: TabsProps): JSX.Element;
export declare function Select(p: SelectProps): JSX.Element;
export declare function Table<R>(p: TableProps<R>): JSX.Element;
export declare function Drawer(p: DrawerProps): JSX.Element | null;
