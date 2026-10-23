import type { Role } from "../../api";

export type ContaValues = { email: string; password: string; role: Role; teamId: number | null; playerId: number | null };

/** O que falta para a conta valer: coach precisa de time; player, de time e jogador. */
export function validarConta(v: ContaValues, mode: "criar" | "editar"): string | null {
  if (mode === "criar" && !/^\S+@\S+\.\S+$/.test(v.email)) return "Informe um e-mail válido.";
  if ((mode === "criar" || v.password) && v.password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (v.role !== "admin" && v.teamId == null) return "Escolha o time da conta.";
  if (v.role === "player" && v.playerId == null) return "Escolha o jogador no elenco do time.";
  return null;
}
