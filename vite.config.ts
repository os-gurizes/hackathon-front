/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      // Em dev o front chama /api e o Vite repassa para a API: mesma origem, cookie de sessão sem dor de CORS
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY ?? "http://localhost:3333",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          // O cookie de refresh da API vale só em /auth; aqui ele precisa valer em /api/auth
          cookiePathRewrite: { "/auth": "/api/auth" },
          // Túnel do ngrok (gratuito) mostra uma página de aviso sem este cabeçalho
          headers: { "ngrok-skip-browser-warning": "1" },
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
