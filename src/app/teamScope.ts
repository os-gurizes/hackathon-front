import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { q, type Me } from "../api";
import { useMe } from "./session";

type Team = NonNullable<Me["team"]>;

// Time que o admin está analisando, escolhido no topo e lembrado neste navegador
const KEY = "sala-tatica:time-em-analise";
const listeners = new Set<() => void>();

function read(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    return Number.isInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setAdminTeam(id: number) {
  try {
    localStorage.setItem(KEY, String(id));
  } catch {
    // Sem armazenamento a escolha vale só até recarregar
  }
  memory = id;
  listeners.forEach((l) => l());
}

let memory: number | null = null;
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useAdminTeamId(): number | null {
  return useSyncExternalStore(subscribe, () => read() ?? memory);
}

/** Times com partidas suficientes para uma leitura, do que mais jogou para o que menos jogou. */
export function useTeamOptionsStatus(enabled = true) {
  const teams = useQuery({ ...q.teams.list(), enabled });
  const options = (teams.data ?? []).filter((t) => t.matches >= 5).sort((a, b) => b.matches - a.matches);
  return { options, loading: enabled && teams.isPending };
}

export const useTeamOptions = (enabled = true) => useTeamOptionsStatus(enabled).options;

/**
 * O time que as telas de coach mostram: o do coach logado ou, para o admin, o escolhido em
 * "Time em análise" (por padrão o que mais jogou, para nenhuma tela abrir vazia).
 */
export function useTeamScope(): Team | null {
  const me = useMe();
  const isAdmin = me.role === "admin";
  const chosen = useAdminTeamId();
  const options = useTeamOptions(isAdmin);
  if (!isAdmin) return me.team;
  return (options.find((t) => t.team.id === chosen) ?? options[0])?.team ?? null;
}
