import { api, unwrap } from "../client";
import type { AdminUserInput, AdminUserPatch } from "../types";

export const adminService = {
  users: () => unwrap(api.GET("/admin/users")),
  create: (body: AdminUserInput) => unwrap(api.POST("/admin/users", { body })),
  update: (id: number, body: AdminUserPatch) => unwrap(api.PATCH("/admin/users/{id}", { params: { path: { id } }, body })),
};
