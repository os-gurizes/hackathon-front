/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY ?? "http://localhost:3333";
  // Túnel do ngrok (gratuito) mostra uma página de aviso sem este cabeçalho
  const NGROK = { "ngrok-skip-browser-warning": "1" };
  const proxy = {
    "/api": { target: apiTarget, changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api/, ""), headers: NGROK },
    "/auth": { target: apiTarget, changeOrigin: true, headers: NGROK },
  };
  return {
    plugins: [react()],
    server: {
      // O mesmo que o vercel.json faz em produção: /api/* vai para a API sem o prefixo e /auth/*
      // vai igual (o cookie de refresh da API só vale em /auth). Mesma origem, sem dor de CORS.
      proxy,
    },
    // `npm run preview` serve o build de produção com o mesmo proxy, para testar como na Vercel
    preview: { proxy },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
