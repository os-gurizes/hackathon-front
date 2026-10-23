import { QueryClient, queryOptions } from "@tanstack/react-query";
import { ApiError } from "./client";
import { adminService } from "./services/admin";
import { authService } from "./services/auth";
import { catalogService } from "./services/catalog";
import { insightsService, mapsService, statsService } from "./services/analytics";
import { matchesService } from "./services/matches";
import { playbookService } from "./services/playbook";
import { playersService } from "./services/players";
import { teamsService } from "./services/teams";
import type { GetQuery, HeatmapQuery, InsightQuery } from "./types";

// Uso nas telas: `const { data } = useQuery(q.teams.economy(teamId, { map }))`.
// As chaves seguem [domínio, id, recurso, filtros] para invalidar por partes:
// `queryClient.invalidateQueries({ queryKey: ["teams", teamId] })` limpa tudo daquele time.

export const q = {
  me: () => queryOptions({ queryKey: ["me"], queryFn: authService.me, retry: false, staleTime: Infinity }),

  catalog: {
    tournaments: () => queryOptions({ queryKey: ["catalog", "tournaments"], queryFn: catalogService.tournaments, staleTime: Infinity }),
    maps: () => queryOptions({ queryKey: ["catalog", "maps"], queryFn: catalogService.maps, staleTime: Infinity }),
    agents: () => queryOptions({ queryKey: ["catalog", "agents"], queryFn: catalogService.agents, staleTime: Infinity }),
    weapons: () => queryOptions({ queryKey: ["catalog", "weapons"], queryFn: catalogService.weapons, staleTime: Infinity }),
    standings: (id: number) => queryOptions({ queryKey: ["catalog", "standings", id], queryFn: () => catalogService.standings(id) }),
  },

  teams: {
    list: (f?: GetQuery<"/teams">) => queryOptions({ queryKey: ["teams", "list", f], queryFn: () => teamsService.list(f) }),
    get: (id: number) => queryOptions({ queryKey: ["teams", id], queryFn: () => teamsService.get(id) }),
    economy: (id: number, f?: GetQuery<"/teams/{id}/economy">) =>
      queryOptions({ queryKey: ["teams", id, "economy", f], queryFn: () => teamsService.economy(id, f) }),
    strategies: (id: number, f?: GetQuery<"/teams/{id}/strategies">) =>
      queryOptions({ queryKey: ["teams", id, "strategies", f], queryFn: () => teamsService.strategies(id, f) }),
    rotations: (id: number, f?: GetQuery<"/teams/{id}/rotations">) =>
      queryOptions({ queryKey: ["teams", id, "rotations", f], queryFn: () => teamsService.rotations(id, f) }),
    combos: (id: number, f?: GetQuery<"/teams/{id}/combos">) =>
      queryOptions({ queryKey: ["teams", id, "combos", f], queryFn: () => teamsService.combos(id, f) }),
    pressure: (id: number, f?: GetQuery<"/teams/{id}/pressure">) =>
      queryOptions({ queryKey: ["teams", id, "pressure", f], queryFn: () => teamsService.pressure(id, f) }),
  },

  players: {
    list: (f?: GetQuery<"/players">) => queryOptions({ queryKey: ["players", "list", f], queryFn: () => playersService.list(f) }),
    get: (id: number) => queryOptions({ queryKey: ["players", id], queryFn: () => playersService.get(id) }),
    stats: (id: number, f?: GetQuery<"/players/{id}/stats">) =>
      queryOptions({ queryKey: ["players", id, "stats", f], queryFn: () => playersService.stats(id, f) }),
    matches: (id: number, f?: GetQuery<"/players/{id}/matches">) =>
      queryOptions({ queryKey: ["players", id, "matches", f], queryFn: () => playersService.matches(id, f) }),
    agents: (id: number, f?: GetQuery<"/players/{id}/agents">) =>
      queryOptions({ queryKey: ["players", id, "agents", f], queryFn: () => playersService.agents(id, f) }),
    weapons: (id: number, f?: GetQuery<"/players/{id}/weapons">) =>
      queryOptions({ queryKey: ["players", id, "weapons", f], queryFn: () => playersService.weapons(id, f) }),
    patterns: (id: number, f?: GetQuery<"/players/{id}/patterns">) =>
      queryOptions({ queryKey: ["players", id, "patterns", f], queryFn: () => playersService.patterns(id, f) }),
    pressure: (id: number, f?: GetQuery<"/players/{id}/pressure">) =>
      queryOptions({ queryKey: ["players", id, "pressure", f], queryFn: () => playersService.pressure(id, f) }),
    abilities: (id: number, f?: GetQuery<"/players/{id}/abilities">) =>
      queryOptions({ queryKey: ["players", id, "abilities", f], queryFn: () => playersService.abilities(id, f) }),
  },

  matches: {
    list: (f?: GetQuery<"/matches">) => queryOptions({ queryKey: ["matches", "list", f], queryFn: () => matchesService.list(f) }),
    get: (id: number) => queryOptions({ queryKey: ["matches", id], queryFn: () => matchesService.get(id) }),
    rounds: (id: number) => queryOptions({ queryKey: ["matches", id, "rounds"], queryFn: () => matchesService.rounds(id) }),
    replay: (id: number, n: number) =>
      queryOptions({ queryKey: ["matches", id, "replay", n], queryFn: () => matchesService.replay(id, n), staleTime: Infinity }),
  },

  maps: {
    stats: (id: number, f?: GetQuery<"/maps/{id}/stats">) =>
      queryOptions({ queryKey: ["maps", id, "stats", f], queryFn: () => mapsService.stats(id, f) }),
    heatmap: (id: number, f: HeatmapQuery) =>
      queryOptions({ queryKey: ["maps", id, "heatmap", f], queryFn: () => mapsService.heatmap(id, f) }),
  },

  stats: {
    weapons: (f?: GetQuery<"/weapons/stats">) => queryOptions({ queryKey: ["stats", "weapons", f], queryFn: () => statsService.weapons(f) }),
    agents: (f?: GetQuery<"/agents/stats">) => queryOptions({ queryKey: ["stats", "agents", f], queryFn: () => statsService.agents(f) }),
  },

  insights: (f: InsightQuery) => queryOptions({ queryKey: ["insights", f], queryFn: () => insightsService.list(f) }),

  admin: {
    users: () => queryOptions({ queryKey: ["admin", "users"], queryFn: adminService.users }),
  },

  playbook: {
    list: (teamId: number, f?: GetQuery<"/teams/{id}/playbook">) =>
      queryOptions({ queryKey: ["playbook", "team", teamId, f], queryFn: () => playbookService.list(teamId, f) }),
    get: (id: number) => queryOptions({ queryKey: ["playbook", id], queryFn: () => playbookService.get(id) }),
  },
};

/** Erro 4xx não melhora repetindo; falha de rede e 5xx tentam mais duas vezes. */
const shouldRetry = (failures: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failures < 2;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Os dados do ETL mudam pouco: 5 minutos sem refazer a mesma consulta
      queries: { staleTime: 5 * 60_000, retry: shouldRetry, refetchOnWindowFocus: false },
    },
  });
}
