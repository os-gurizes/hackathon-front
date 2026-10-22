import createClient from "openapi-fetch";
import type { paths } from "./schema";

/** Em dev o Vite repassa `/api` para a API (ver vite.config.ts); em produção, a URL vem do ambiente. */
const API_URL = import.meta.env.VITE_API_URL ?? "/api";
export const API_BASE = new URL(API_URL, window.location.origin).toString().replace(/\/$/, "");

export type ApiErrorCode = "VALIDATION" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL" | "NETWORK";

const MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION: "Algum dado enviado não é válido.",
  UNAUTHORIZED: "Sua sessão expirou. Entre de novo.",
  FORBIDDEN: "Você não tem acesso a esta informação.",
  NOT_FOUND: "Não encontramos o que você procurou.",
  CONFLICT: "Esta informação mudou enquanto você editava. Recarregue e tente de novo.",
  INTERNAL: "O servidor teve um problema. Tente de novo em instantes.",
  NETWORK: "Não foi possível falar com o servidor. Confira a conexão.",
};

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message = MESSAGES[code],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const codeFromStatus = (status: number): ApiErrorCode =>
  ({ 400: "VALIDATION", 401: "UNAUTHORIZED", 403: "FORBIDDEN", 404: "NOT_FOUND", 409: "CONFLICT" } as const)[status] ??
  "INTERNAL";

// Várias requisições podem receber 401 ao mesmo tempo: uma renovação só para todas
let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** O token de acesso dura 15 min: ao receber 401, renova pelo refresh e repete a requisição uma vez. */
async function fetchWithRefresh(request: Request): Promise<Response> {
  const retry = request.clone();
  const response = await fetch(request);
  if (response.status !== 401 || new URL(request.url).pathname.includes("/auth/")) return response;
  return (await refreshSession()) ? fetch(retry) : response;
}

export const api = createClient<paths>({ baseUrl: API_BASE, credentials: "include", fetch: fetchWithRefresh });

type Result<T> = { data?: T; error?: unknown; response: Response };

/** Devolve o corpo da resposta ou lança ApiError com código e mensagem em pt-BR. */
export async function unwrap<T>(call: Promise<Result<T>>): Promise<T> {
  let result: Result<T>;
  try {
    result = await call;
  } catch {
    throw new ApiError("NETWORK", 0);
  }
  if (result.response.ok) return result.data as T;
  const body = result.error as { error?: { code?: ApiErrorCode; message?: string } } | undefined;
  const code = body?.error?.code ?? codeFromStatus(result.response.status);
  throw new ApiError(code, result.response.status, body?.error?.message ?? MESSAGES[code]);
}
