import type { ReactNode } from "react";
import { cx } from "../cx";
import styles from "./Table.module.css";

export interface TableColumn<R> {
  key: string;
  label: ReactNode;
  numeric?: boolean;
  render?: (row: R) => ReactNode;
}

export interface TableProps<R extends { id?: string | number }> {
  columns: TableColumn<R>[];
  rows: R[];
  caption?: ReactNode;
  highlight?: string | number;
  className?: string;
}

export function Table<R extends { id?: string | number }>({ columns, rows, caption, highlight, className }: TableProps<R>) {
  return (
    <table className={cx(styles.table, className)}>
      {caption ? <caption>{caption}</caption> : null}
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col" className={c.numeric ? styles.num : undefined}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const key = r.id ?? i;
          return (
            <tr key={key} className={highlight != null && key === highlight ? styles.highlight : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={c.numeric ? styles.num : undefined}>
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
