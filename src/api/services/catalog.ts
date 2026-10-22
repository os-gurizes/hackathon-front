import { api, unwrap } from "../client";

export const catalogService = {
  tournaments: () => unwrap(api.GET("/tournaments")),
  standings: (id: number) => unwrap(api.GET("/tournaments/{id}/standings", { params: { path: { id } } })),
  series: (id: number) => unwrap(api.GET("/series/{id}", { params: { path: { id } } })),
  maps: () => unwrap(api.GET("/maps")),
  map: (id: number) => unwrap(api.GET("/maps/{id}", { params: { path: { id } } })),
  agents: () => unwrap(api.GET("/agents")),
  weapons: () => unwrap(api.GET("/weapons")),
};
