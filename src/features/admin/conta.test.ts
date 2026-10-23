import { validarConta, type ContaValues } from "./conta";

const base: ContaValues = { email: "coach.time@vstats.local", password: "12345678", role: "coach", teamId: 7, playerId: null };

describe("validação de conta", () => {
  it("coach com time e senha válida passa", () => {
    expect(validarConta(base, "criar")).toBeNull();
  });

  it("pede e-mail válido e senha de 8 caracteres ao criar", () => {
    expect(validarConta({ ...base, email: "sem-arroba" }, "criar")).toMatch(/e-mail/);
    expect(validarConta({ ...base, password: "curta" }, "criar")).toMatch(/8 caracteres/);
  });

  it("ao editar, a senha é opcional, mas se vier precisa de 8 caracteres", () => {
    expect(validarConta({ ...base, email: "", password: "" }, "editar")).toBeNull();
    expect(validarConta({ ...base, password: "123" }, "editar")).toMatch(/8 caracteres/);
  });

  it("coach e player precisam de time; player também de jogador; admin não precisa de nada", () => {
    expect(validarConta({ ...base, teamId: null }, "criar")).toMatch(/time/);
    expect(validarConta({ ...base, role: "player" }, "criar")).toMatch(/jogador/);
    expect(validarConta({ ...base, role: "player", playerId: 101 }, "criar")).toBeNull();
    expect(validarConta({ ...base, role: "admin", teamId: null }, "criar")).toBeNull();
  });
});
