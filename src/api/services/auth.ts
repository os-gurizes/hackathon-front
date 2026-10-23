import { api, authApi, unwrap } from "../client";
import type { LoginInput } from "../types";

export const authService = {
  login: (body: LoginInput) => unwrap(authApi.POST("/auth/login", { body })),
  logout: () => unwrap(authApi.POST("/auth/logout")),
  me: () => unwrap(api.GET("/me")),
};
