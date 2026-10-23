import type { Role } from "../api";

// Guarda por papel se o tour do primeiro acesso já foi visto neste navegador
const chave = (role: Role) => `sala-tatica:tour-visto:${role === "player" ? "player" : "coach"}`;

export function tourVisto(role: Role): boolean {
  try {
    return localStorage.getItem(chave(role)) === "1";
  } catch {
    return true;
  }
}

export function marcarTourVisto(role: Role) {
  try {
    localStorage.setItem(chave(role), "1");
  } catch {
    // Sem armazenamento o tour aparece de novo na próxima visita, sem outro efeito
  }
}
