import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./design/global.css";
import { App } from "./app/App";
import { createQueryClient } from "./api";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado");

/** Com VITE_API_MOCK=true as chamadas à API recebem os dados de exemplo de src/api/mocks. */
async function startMocks() {
  if (import.meta.env.VITE_API_MOCK !== "true") return;
  const { worker } = await import("./api/mocks/browser");
  await worker.start({ onUnhandledFrame: "bypass", quiet: true });
}

const queryClient = createQueryClient();

void startMocks().then(() =>
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  ),
);
