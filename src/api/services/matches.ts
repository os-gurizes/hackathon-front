import { api, unwrap } from "../client";
import type { GetQuery } from "../types";

export const matchesService = {
  list: (query?: GetQuery<"/matches">) => unwrap(api.GET("/matches", { params: { query } })),
  get: (id: number) => unwrap(api.GET("/matches/{id}", { params: { path: { id } } })),
  rounds: (id: number) => unwrap(api.GET("/matches/{id}/rounds", { params: { path: { id } } })),
  /** Snapshots de posição de um round, em ordem de tempo, para o replay 2D. */
  replay: (id: number, n: number) => unwrap(api.GET("/matches/{id}/rounds/{n}/replay", { params: { path: { id, n } } })),
};
