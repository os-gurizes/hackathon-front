import { useMemo } from "react";

const NAMES = ["ink-900", "ink-800", "ink-700", "line", "line-strong", "bone", "bone-muted", "signal", "cyan", "gold", "ok", "focus"] as const;

type TokenName = (typeof NAMES)[number];
type CamelCase<S extends string> = S extends `${infer A}-${infer B}` ? `${A}${Capitalize<CamelCase<B>>}` : S;
export type Tokens = { [K in TokenName as CamelCase<K>]: string };

const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

/** O canvas não lê CSS: resolve as cores dos tokens uma vez, a partir do tema ativo. */
export function readTokens(el: Element = document.documentElement): Tokens {
  const style = getComputedStyle(el);
  const entries = NAMES.map((n) => {
    const raw = style.getPropertyValue(`--${n}`).trim();
    const resolved = raw.startsWith("var(") ? style.getPropertyValue(raw.slice(4, -1)).trim() : raw;
    return [camel(n), resolved || "#888888"];
  });
  return Object.fromEntries(entries) as Tokens;
}

export function useTokens(): Tokens {
  return useMemo(() => readTokens(), []);
}

/** Hex de 6 dígitos com transparência (0..1). */
export const withAlpha = (hex: string, alpha: number) =>
  hex.length === 7
    ? hex +
      Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0")
    : hex;
