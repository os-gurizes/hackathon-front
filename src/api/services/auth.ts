import { api, unwrap } from "../client";
import type { LoginInput } from "../types";

export const authService = {
  login: (body: LoginInput) => unwrap(api.POST("/auth/login", { body })),
  logout: () => unwrap(api.POST("/auth/logout")),
  me: () => unwrap(api.GET("/me")),
};
