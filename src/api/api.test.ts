import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { API_BASE, ApiError, authService, insightsService, mapsService, playersService, teamsService } from ".";
import { handlers, setMockRole } from "./mocks/handlers";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => setMockRole("coach"));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const fail = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as ApiError;
  }
  throw new Error("era esperado um erro");
};

describe("serviços da API com os dados de exemplo", () => {
  it("lê time, economia e insights do time", async () => {
    const team = await teamsService.get(7);
    expect(team.team.displayName).toBe("Corvos do Campus");
    expect(team.maps.length).toBeGreaterThan(0);

    const economy = await teamsService.economy(7, { map: 2 });
    expect(economy.byBuyType.map((b) => b.buyType)).toEqual(["pistol", "eco", "semi_eco", "half_buy", "full_buy"]);

    const insights = await insightsService.list({ scope: "team", id: 7 });
    expect(insights[0]?.title).toBeTruthy();
  });

  it("insights do jogador vêm separados dos do time", async () => {
    const team = await insightsService.list({ scope: "team", id: 7 });
    const player = await insightsService.list({ scope: "player", id: 101 });
    expect(player.map((i) => i.id)).not.toEqual(team.map((i) => i.id));
  });

  it("parâmetros com padrão na API são opcionais no front", async () => {
    const matches = await playersService.matches(101);
    expect(matches.items.length).toBeGreaterThan(0);
    const heat = await mapsService.heatmap(2, { metric: "kills" });
    expect(heat.metric).toBe("kills");
    expect(heat.cells.length).toBeGreaterThan(0);
  });

  it("login define o papel pelo e-mail e logout encerra a sessão", async () => {
    const player = await authService.login({ email: "jogador@salatatica.dev", password: "x" });
    expect(player.role).toBe("player");
    expect((await authService.me()).player?.gameName).toBe("Vento");

    await authService.logout();
    const err = await fail(authService.me());
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("UNAUTHORIZED");
  });
});

describe("erros", () => {
  it("usa o código e a mensagem que a API mandar", async () => {
    server.use(
      http.get(`${API_BASE}/teams/:id`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "Time 99 não existe." } }, { status: 404 }),
      ),
    );
    const err = await fail(teamsService.get(99));
    expect(err.code).toBe("NOT_FOUND");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Time 99 não existe.");
  });

  it("sem corpo de erro, deduz o código pelo status e explica em pt-BR", async () => {
    server.use(http.get(`${API_BASE}/teams/:id`, () => new HttpResponse(null, { status: 403 })));
    const err = await fail(teamsService.get(7));
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("Você não tem acesso a esta informação.");
  });

  it("falha de rede vira NETWORK", async () => {
    server.use(http.get(`${API_BASE}/teams/:id`, () => HttpResponse.error()));
    const err = await fail(teamsService.get(7));
    expect(err.code).toBe("NETWORK");
  });

  it("rota sem dado de exemplo avisa onde adicionar", async () => {
    const err = await fail(teamsService.combos(7));
    expect(err.status).toBe(501);
    expect(err.message).toContain("src/api/mocks");
  });
});

describe("sessão", () => {
  it("com 401, renova pelo refresh e repete a chamada uma vez", async () => {
    let calls = 0;
    let refreshed = 0;
    server.use(
      http.get(`${API_BASE}/teams/:id`, () => {
        calls++;
        return calls === 1 ? new HttpResponse(null, { status: 401 }) : HttpResponse.json({ ok: true });
      }),
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshed++;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await teamsService.get(7);
    expect(calls).toBe(2);
    expect(refreshed).toBe(1);
  });

  it("chamadas simultâneas com 401 dividem uma renovação só", async () => {
    let refreshed = 0;
    const seen = new Set<string>();
    server.use(
      http.get(`${API_BASE}/players/:id`, ({ params }) => {
        const id = String(params.id);
        if (!seen.has(id)) {
          seen.add(id);
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({ ok: id });
      }),
      http.post(`${API_BASE}/auth/refresh`, async () => {
        refreshed++;
        await new Promise((r) => setTimeout(r, 20));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await Promise.all([playersService.get(1), playersService.get(2), playersService.get(3)]);
    expect(refreshed).toBe(1);
  });

  it("se a renovação falhar, devolve o 401 original", async () => {
    setMockRole("none");
    const err = await fail(teamsService.get(7));
    expect(err.code).toBe("UNAUTHORIZED");
  });
});
