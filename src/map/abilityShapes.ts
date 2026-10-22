import type { Point } from "./mapData";

// Como cada habilidade é desenhada no mapa, em metros do jogo (convertidos por mapa com
// metersToMinimap). Não há fonte oficial com essas dimensões, então os valores são
// APROXIMADOS e podem ser ajustados aqui. Habilidades fora da lista aparecem só como ícone.
//
// Chaves: `${agentId}-${slot}`. Tipos:
//   area      círculo em volta do ícone                              { radius }
//   wall      linha de tamanho fixo centrada no ícone                { length }
//   direction faixa (ou cone) que sai do ícone e pode ser mirada     { length, width, cone?, outline? }
//   tripwire  linha entre o ícone e uma segunda ponta móvel          { maxLength }
export type AbilityShape =
  | { type: "area"; radius: number }
  | { type: "wall"; length: number }
  | { type: "direction"; length: number; width: number; cone?: boolean; outline?: boolean }
  | { type: "tripwire"; maxLength: number };

const OMEN = "8e253930-4c05-31dd-1b6c-968525494517";
const BRIMSTONE = "9f0d8ba9-4140-b941-57d3-a7ad57c6b417";
const ASTRA = "41fb69c1-4189-7b37-f117-bcaf1e96f1bf";
const CLOVE = "1dbf2edd-4729-0984-3115-daa5eed44993";
const VIPER = "707eab51-4836-f488-046a-cda6bf494859";
const HARBOR = "95b78ed7-4637-86d9-7e41-71ba8c293152";
const JETT = "add6443a-41bd-e414-f6ad-e58d267f4e95";
const PHOENIX = "eb93336a-449b-9c1b-0a54-a891f7921d69";
const KILLJOY = "1e58de9c-4950-5125-93e9-a0aee9f98746";
const CYPHER = "117ed9e3-49f3-6512-3ccf-0cada7e3823b";
const SAGE = "569fdd95-4d10-43ab-ca70-79becc718b46";
const KAYO = "601dbbe7-43ce-be57-2a40-4abd24953621";
const NEON = "bb2a4828-46eb-8cd1-e765-15848195d751";
const BREACH = "5f8d3a7f-467b-97f3-062c-13acf203c006";
const SOVA = "320b2a48-4d9b-a075-30f1-1f93a9b638fa";
const FADE = "dade69b4-4f5a-8528-247b-219e5a1facd6";
const RAZE = "f94c3b30-42be-e959-889c-5aa313dba261";

export const ABILITY_SHAPES: Record<string, AbilityShape> = {
  // Smokes
  [`${OMEN}-Ability2`]: { type: "area", radius: 4.1 },
  [`${BRIMSTONE}-Ability2`]: { type: "area", radius: 4.15 },
  [`${ASTRA}-Ability2`]: { type: "area", radius: 4.75 },
  [`${CLOVE}-Ability2`]: { type: "area", radius: 4.1 },
  [`${VIPER}-Ability1`]: { type: "area", radius: 4.5 },
  [`${HARBOR}-Ability2`]: { type: "area", radius: 4.5 },
  [`${JETT}-Grenade`]: { type: "area", radius: 3.35 },

  // Outras áreas (molotovs, slows, jaulas, ultimates)
  [`${BRIMSTONE}-Ability1`]: { type: "area", radius: 4.5 },
  [`${BRIMSTONE}-Ultimate`]: { type: "area", radius: 9 },
  [`${ASTRA}-Grenade`]: { type: "area", radius: 4.75 },
  [`${ASTRA}-Ability1`]: { type: "area", radius: 4.75 },
  [`${VIPER}-Grenade`]: { type: "area", radius: 4.5 },
  [`${VIPER}-Ultimate`]: { type: "area", radius: 17.5 },
  [`${PHOENIX}-Ability1`]: { type: "area", radius: 4.5 },
  [`${KILLJOY}-Grenade`]: { type: "area", radius: 3.5 },
  [`${KILLJOY}-Ultimate`]: { type: "area", radius: 32.5 },
  [`${CYPHER}-Ability1`]: { type: "area", radius: 3.75 },
  [`${SAGE}-Ability1`]: { type: "area", radius: 6 },
  [`${KAYO}-Grenade`]: { type: "area", radius: 5 },

  // Paredes
  [`${SAGE}-Grenade`]: { type: "wall", length: 9 },
  [`${ASTRA}-Ultimate`]: { type: "wall", length: 300 },
  [`${VIPER}-Ability2`]: { type: "direction", length: 50, width: 0.8 },
  [`${HARBOR}-Ability1`]: { type: "direction", length: 40, width: 0.8 },
  [`${PHOENIX}-Grenade`]: { type: "direction", length: 18, width: 0.8 },
  [`${NEON}-Grenade`]: { type: "direction", length: 40, width: 4, outline: true },

  // Tripwires
  [`${CYPHER}-Grenade`]: { type: "tripwire", maxLength: 15 },

  // Habilidades com direção
  [`${OMEN}-Ability1`]: { type: "direction", length: 20, width: 4 },
  [`${BREACH}-Ability2`]: { type: "direction", length: 46, width: 4.5 },
  [`${BREACH}-Ultimate`]: { type: "direction", length: 32, width: 18, cone: true },
  [`${SOVA}-Ultimate`]: { type: "direction", length: 66, width: 2.4 },
  [`${FADE}-Grenade`]: { type: "direction", length: 25, width: 2 },
  [`${RAZE}-Grenade`]: { type: "direction", length: 30, width: 2 },
};

/** Rotação 0 aponta para cima; os ângulos crescem no sentido horário. */
export function pointAt({ x, y }: Point, rotation: number, distance: number): Point {
  const rad = (rotation * Math.PI) / 180;
  return { x: x + Math.sin(rad) * distance, y: y - Math.cos(rad) * distance };
}

/** Ângulo (graus) de `origin` até `target`, na mesma convenção de pointAt. */
export function angleTo(origin: Point, target: Point): number {
  return (Math.atan2(target.x - origin.x, origin.y - target.y) * 180) / Math.PI;
}

/** Onde fica a alça de mira ou de comprimento de uma habilidade com forma (null se não tiver). */
export function handlePosition(
  shape: AbilityShape | null,
  at: Point,
  rotation: number,
  end: Point | undefined,
  metersToMinimap: number,
): Point | null {
  if (!shape) return null;
  if (shape.type === "direction") return pointAt(at, rotation, shape.length * metersToMinimap);
  if (shape.type === "wall") return pointAt(at, rotation, (Math.min(shape.length, 30) * metersToMinimap) / 2);
  if (shape.type === "tripwire") return end ?? null;
  return null;
}
