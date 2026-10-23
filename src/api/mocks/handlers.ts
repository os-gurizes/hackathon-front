import { http, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from "msw";
import { API_BASE, AUTH_BASE } from "../client";
import type { AdminUserInput, AdminUserPatch, Heatmap, InsightQuery } from "../types";
import {
  AGENTS,
  heatmapFor,
  initialAdminUsers,
  MAP_STATS,
  MAPS_SUMMARY,
  MATCH_ITEM,
  MATCH_ROUNDS,
  MATCHES,
  ROUND_REPLAY,
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
type MockRole = "coach" | "player" | "admin" | "none";
const KEY = "sala-tatica:mock-session";
let memory: MockRole = "coach";

export function getMockRole(): MockRole {
  try {
    const v = localStorage.getItem(KEY);
    return v === "coach" || v === "player" || v === "admin" || v === "none" ? v : memory;
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
const forbidden = () => error(403, "FORBIDDEN", "Só o admin gerencia contas.");
const unauthorized = () => error(401, "UNAUTHORIZED", "Sessão expirada.");

/** Rotas que exigem login devolvem 401 sem sessão, como a API real. */
function authed<P extends PathParams>(fn: HttpResponseResolver<P, DefaultBodyType>): HttpResponseResolver<P, DefaultBodyType> {
  return (info) => (getMockRole() === "none" ? unauthorized() : fn(info));
}

// Contas da tela de admin: começam iguais a cada carga e mudam com POST e PATCH
const adminUsers = initialAdminUsers();

export const handlers = [
  http.post(authUrl("/auth/login"), async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password || body.password === "errada") return error(401, "UNAUTHORIZED", "E-mail ou senha incorretos.");
    const role = /admin/i.test(body.email) ? "admin" : /jogador|player/i.test(body.email) ? "player" : "coach";
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
    authed(() => HttpResponse.json(meFor(getMockRole() as "coach" | "player" | "admin"))),
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

  http.get(url("/matches"), authed(() => HttpResponse.json(MATCHES))),
  http.get(url("/matches/:id"), authed(() => HttpResponse.json({ ...MATCH_ITEM, gameVersion: "13.06", scoreboard: [] }))),
  http.get(url("/matches/:id/rounds"), authed(() => HttpResponse.json(MATCH_ROUNDS))),
  http.get(url("/matches/:id/rounds/:n/replay"), authed(({ params }) => HttpResponse.json(ROUND_REPLAY(Number(params.n))))),

  http.get(url("/admin/users"), authed(() => (getMockRole() === "admin" ? HttpResponse.json(adminUsers) : forbidden()))),
  http.post(
    url("/admin/users"),
    authed(async ({ request }) => {
      if (getMockRole() !== "admin") return forbidden();
      const body = (await request.json()) as AdminUserInput;
      if (!body.email?.includes("@") || (body.password ?? "").length < 8) return error(400, "VALIDATION", "E-mail inválido ou senha com menos de 8 caracteres.");
      if (adminUsers.some((u) => u.email === body.email)) return error(409, "CONFLICT", "Já existe uma conta com este e-mail.");
      const user = { id: Math.max(...adminUsers.map((u) => u.id)) + 1, email: body.email, role: body.role, playerId: body.playerId ?? null, teamId: body.teamId ?? null, createdAt: new Date().toISOString() };
      adminUsers.push(user);
      return HttpResponse.json(user, { status: 201 });
    }),
  ),
  http.patch(
    url("/admin/users/:id"),
    authed(async ({ params, request }) => {
      if (getMockRole() !== "admin") return forbidden();
      const user = adminUsers.find((u) => u.id === Number(params.id));
      if (!user) return error(404, "NOT_FOUND", "Conta não encontrada.");
      const body = (await request.json()) as AdminUserPatch;
      if (body.password !== undefined && body.password.length < 8) return error(400, "VALIDATION", "Senha com menos de 8 caracteres.");
      if (body.role) user.role = body.role;
      if (body.teamId !== undefined) user.teamId = body.teamId;
      if (body.playerId !== undefined) user.playerId = body.playerId;
      return HttpResponse.json(user);
    }),
  ),

  // Qualquer outra rota da API ainda não tem dado de exemplo: falha de forma explícita
  http.all(url("/*"), ({ request }) =>
    error(501, "INTERNAL", `Ainda sem dado de exemplo para ${request.method} ${new URL(request.url).pathname}. Veja src/api/mocks.`),
  ),
];
