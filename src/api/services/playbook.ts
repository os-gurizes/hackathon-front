import { api, unwrap } from "../client";
import type { Body, GetQuery } from "../types";

export const playbookService = {
  list: (teamId: number, query?: GetQuery<"/teams/{id}/playbook">) =>
    unwrap(api.GET("/teams/{id}/playbook", { params: { path: { id: teamId }, query } })),
  create: (teamId: number, body: Body<"/teams/{id}/playbook", "post">) =>
    unwrap(api.POST("/teams/{id}/playbook", { params: { path: { id: teamId } }, body })),
  get: (id: number) => unwrap(api.GET("/playbook/{id}", { params: { path: { id } } })),
  save: (id: number, body: Body<"/playbook/{id}", "put">) => unwrap(api.PUT("/playbook/{id}", { params: { path: { id } }, body })),
  remove: (id: number) => unwrap(api.DELETE("/playbook/{id}", { params: { path: { id } } })),
};
