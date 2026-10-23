import { http, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from "msw";
import { API_BASE, AUTH_BASE } from "../client";
import type { Heatmap, InsightQuery } from "../types";
import {
  AGENTS,
  heatmapFor,
  MAP_STATS,
  MAPS_SUMMARY,
  meFor,
  PLAYER_INSIGHTS,
  PLAYER_MATCHES,
  PLAYER_PROFILE,
  PLAYER_STATS,
  TEAM_DETAIL,
  TEAM_ECONOMY,
  TEAM_INSIGHTS,
  TEAMS,
} from "./data";

// Sessão de exemplo: "coach" por padrão. O login com e-mail que tenha "jogador" ou "player"
// entra como player; a senha "errada" devolve 401 para testar a tela de erro.
type MockRole = "coach" | "player" | "none";
const KEY = "sala-tatica:mock-session";
let memory: MockRole = "coach";

export function getMockRole(): MockRole {
  try {
    const v = localStorage.getItem(KEY);
    return v === "coach" || v === "player" || v === "none" ? v : memory;
  } catch {
    return memory;
  }
}

export function setMockRole(role: MockRole) {
  memory = role;
  try {
    localStorage.setItem(KEY, role);
  } catch {
    // Sem armazenamento a sessão fica só na memória
  }
}

const url = (path: string) => `${API_BASE}${path}`;
const authUrl = (path: string) => `${AUTH_BASE}${path}`;
const error = (status: number, code: string, message: string) => HttpResponse.json({ error: { code, message } }, { status });
const unauthorized = () => error(401, "UNAUTHORIZED", "Sessão expirada.");

/** Rotas que exigem login devolvem 401 sem sessão, como a API real. */
function authed<P extends PathParams>(fn: HttpResponseResolver<P, DefaultBodyType>): HttpResponseResolver<P, DefaultBodyType> {
  return (info) => (getMockRole() === "none" ? unauthorized() : fn(info));
}

export const handlers = [
  http.post(authUrl("/auth/login"), async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password || body.password === "errada") return error(401, "UNAUTHORIZED", "E-mail ou senha incorretos.");
    const role = /jogador|player/i.test(body.email) ? "player" : "coach";
    setMockRole(role);
    return HttpResponse.json(meFor(role));
  }),
  http.post(authUrl("/auth/logout"), () => {
    setMockRole("none");
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(authUrl("/auth/refresh"), () => (getMockRole() === "none" ? unauthorized() : new HttpResponse(null, { status: 204 }))),
  http.get(
    url("/me"),
    authed(() => HttpResponse.json(meFor(getMockRole() as "coach" | "player"))),
  ),

  http.get(url("/maps"), authed(() => HttpResponse.json(MAPS_SUMMARY))),
  http.get(url("/agents"), authed(() => HttpResponse.json(AGENTS))),
  http.get(url("/teams"), authed(() => HttpResponse.json(TEAMS))),
  http.get(url("/teams/:id"), authed(() => HttpResponse.json(TEAM_DETAIL))),
  http.get(url("/teams/:id/economy"), authed(() => HttpResponse.json(TEAM_ECONOMY))),

  http.get(
    url("/insights"),
    authed(({ request }) => {
      const scope = new URL(request.url).searchParams.get("scope") as InsightQuery["scope"] | null;
      return HttpResponse.json(scope === "player" ? PLAYER_INSIGHTS : TEAM_INSIGHTS);
    }),
  ),

  http.get(url("/maps/:id/stats"), authed(({ params }) => HttpResponse.json(MAP_STATS(Number(params.id))))),
  http.get(
    url("/maps/:id/heatmap"),
    authed(({ params, request }) => {
      const sp = new URL(request.url).searchParams;
      const metric = (sp.get("metric") ?? "presence") as Heatmap["metric"];
      const resolution = (sp.get("resolution") ?? "cells") as Heatmap["resolution"];
      return HttpResponse.json(heatmapFor(Number(params.id), metric, resolution));
    }),
  ),

  http.get(url("/players/:id"), authed(({ params }) => HttpResponse.json(PLAYER_PROFILE(Number(params.id))))),
  http.get(url("/players/:id/stats"), authed(() => HttpResponse.json(PLAYER_STATS))),
  http.get(url("/players/:id/matches"), authed(() => HttpResponse.json(PLAYER_MATCHES))),

  // Qualquer outra rota da API ainda não tem dado de exemplo: falha de forma explícita
  http.all(url("/*"), ({ request }) =>
    error(501, "INTERNAL", `Ainda sem dado de exemplo para ${request.method} ${new URL(request.url).pathname}. Veja src/api/mocks.`),
  ),
];
