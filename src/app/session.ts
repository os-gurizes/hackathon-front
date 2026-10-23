import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, authService, q, type LoginInput, type Me, type Role } from "../api";

export type Session =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "error"; error: Error }
  | { status: "ready"; me: Me };

/** Quem está logado, a partir de GET /me. 401 significa "sem sessão", não erro. */
export function useSession(): Session {
  const me = useQuery(q.me());
  if (me.isPending) return { status: "loading" };
  if (me.error) {
    return me.error instanceof ApiError && me.error.status === 401 ? { status: "anonymous" } : { status: "error", error: me.error };
  }
  return { status: "ready", me: me.data };
}

export function useAuthActions() {
  const client = useQueryClient();
  return {
    async login(input: LoginInput) {
      const me = await authService.login(input);
      // Dados da sessão anterior não podem vazar para a próxima
      client.clear();
      client.setQueryData(q.me().queryKey, me);
      return me;
    },
    async logout() {
      try {
        await authService.logout();
      } finally {
        client.clear();
        client.setQueryData(q.me().queryKey, undefined);
        await client.invalidateQueries({ queryKey: q.me().queryKey });
      }
    },
  };
}

export const homeFor = (role: Role) => (role === "player" ? "/player/desempenho" : "/coach/time");

export const roleLabel: Record<Role, string> = { coach: "Coach", player: "Player", admin: "Admin" };

/** Nome que aparece no topo: o nick do player ou o time do coach. */
export const displayName = (me: Me) => (me.player ? me.player.gameName : (me.team?.displayName ?? me.email));

/** Usuário logado, para telas que só renderizam com sessão (o App garante isso). */
export function useMe(): Me {
  const session = useSession();
  if (session.status !== "ready") throw new Error("useMe fora de uma sessão ativa");
  return session.me;
}
