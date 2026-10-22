import type { Point, Rotation } from "../../../map/mapData";

export type Phase = "setup" | "exec" | "post" | "retake";
export type Side = "attack" | "defense";
export type Background = "minimap" | "callouts";

export const PHASES: Phase[] = ["setup", "exec", "post", "retake"];

type Base = { id: string; phase: Phase };

// Todas as posições no espaço normalizado 0..1 do minimapa, sem rotação: o mesmo do ETL,
// para que os desenhos se sobreponham ao heatmap e ao replay.
export type AgentItem = Base & { kind: "agent"; agentId: string; side: Side; at: Point; weaponId?: string };
/** `ownerId` liga a habilidade ao marcador do agente que a usou; o lado vem dele. */
export type AbilityItem = Base & {
  kind: "ability";
  abilityId: string;
  side: Side;
  at: Point;
  rotation: number;
  end?: Point;
  ownerId?: string;
};
export type ArrowItem = Base & { kind: "arrow"; points: [Point, Point] };
export type PenItem = Base & { kind: "pen"; points: Point[] };
export type AreaItem = Base & { kind: "area"; points: Point[] };
export type TextItem = Base & { kind: "text"; at: Point; text: string };

export type PlaybookItem = AgentItem | AbilityItem | ArrowItem | PenItem | AreaItem | TextItem;

export type Playbook = {
  id: string;
  title: string;
  mapId: string;
  side: Side;
  rotation: Rotation;
  items: PlaybookItem[];
  visiblePhases: Phase[];
  background: Background;
  notes: Record<Phase, string>;
  updatedAt: string;
};

export function newPlaybook(map: { id: string; attackDownRotation: Rotation }): Playbook {
  return {
    id: createId(),
    title: "Nova estratégia",
    mapId: map.id,
    side: "attack",
    rotation: map.attackDownRotation,
    items: [],
    visiblePhases: [...PHASES],
    background: "callouts",
    notes: { setup: "", exec: "", post: "", retake: "" },
    updatedAt: new Date().toISOString(),
  };
}

export const createId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
