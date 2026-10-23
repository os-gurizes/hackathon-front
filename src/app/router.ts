import { useSyncExternalStore } from "react";

// Roteador mínimo por caminho: as rotas cabem numa tabela (routes.tsx). Se o app crescer
// com rotas aninhadas e parâmetros, troca para o TanStack Router previsto no spec.
const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export function usePath() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

/** Navega sem recarregar. Preserva a query string só quando pedida (ex.: ?e= da prancheta). */
export function navigate(to: string, { replace = false }: { replace?: boolean } = {}) {
  if (to === window.location.pathname + window.location.search) return;
  if (replace) window.history.replaceState(null, "", to);
  else window.history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** onClick para links internos: deixa Ctrl/Cmd+clique abrir em outra aba. */
export function linkHandler(to: string) {
  return (e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(to);
  };
}
