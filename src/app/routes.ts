import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { Role } from "../api";

export type Tab = { label: string; path?: string };

export type RouteDef = {
  path: string;
  roles: Role[];
  page: LazyExoticComponent<ComponentType>;
  /** Telas de trabalho (prancheta, heatmap) usam a largura toda da janela. */
  wide?: boolean;
};

// Telas carregadas sob demanda: o bundle inicial fica só com login e o shell
const MeuTimePage = lazy(() => import("../features/coach/time/MeuTimePage"));
const PranchetaPage = lazy(() => import("../features/coach/prancheta/PranchetaPage"));
const MeuDesempenhoPage = lazy(() => import("../features/player/desempenho/MeuDesempenhoPage"));
const MapasPage = lazy(() => import("../features/shared/mapas/MapasPage"));
const PartidaPage = lazy(() => import("../features/coach/partida/PartidaPage"));

export const ROUTES: RouteDef[] = [
  { path: "/coach/time", roles: ["coach", "admin"], page: MeuTimePage },
  { path: "/coach/prancheta", roles: ["coach", "admin"], page: PranchetaPage, wide: true },
  { path: "/coach/heatmap", roles: ["coach", "admin"], page: MapasPage, wide: true },
  { path: "/coach/partida", roles: ["coach", "admin"], page: PartidaPage, wide: true },
  { path: "/player/desempenho", roles: ["player"], page: MeuDesempenhoPage },
  { path: "/player/mapas", roles: ["player"], page: MapasPage, wide: true },
];

/** Abas de cada papel, na ordem do spec. Sem `path` aparecem esmaecidas: ainda não existem. */
export const TABS: Record<"coach" | "player", Tab[]> = {
  coach: [
    { label: "Meu time", path: "/coach/time" },
    { label: "Análise de partida", path: "/coach/partida" },
    { label: "Prancheta", path: "/coach/prancheta" },
    { label: "Estratégias" },
    { label: "Elenco" },
    { label: "Pressão e rotações" },
    { label: "Combos" },
    { label: "Economia do time" },
    { label: "Scouting" },
    { label: "Heatmap", path: "/coach/heatmap" },
  ],
  player: [
    { label: "Meu desempenho", path: "/player/desempenho" },
    { label: "Meus mapas", path: "/player/mapas" },
    { label: "Meus padrões" },
    { label: "Sob pressão" },
    { label: "Armas" },
    { label: "Agentes" },
    { label: "Economia" },
    { label: "Partidas" },
  ],
};

export const tabsFor = (role: Role) => (role === "player" ? TABS.player : TABS.coach);
