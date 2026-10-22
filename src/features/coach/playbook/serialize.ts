import type { Point, Rotation } from "../../../map/mapData";
import { createId, PHASES, type Background, type Phase, type Playbook, type PlaybookItem, type Side } from "./types";

// Leitura tolerante: dados salvos por versões antigas ou links editados à mão viram uma
// estratégia válida, descartando só o que não dá para aproveitar.

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const str = (v: unknown, max = 200): string | null => (typeof v === "string" ? v.slice(0, max) : null);

const ROTATIONS: Rotation[] = [0, 90, 180, 270];
const BACKGROUNDS: Background[] = ["minimap", "callouts"];
const MAX_ITEMS = 2000;

function point(v: unknown): Point | null {
  if (!isObj(v) || !num(v.x) || !num(v.y)) return null;
  return { x: v.x, y: v.y };
}

function points(v: unknown, min: number): Point[] | null {
  if (!Array.isArray(v)) return null;
  const pts = v.map(point);
  if (pts.length < min || pts.some((p) => p === null)) return null;
  return pts as Point[];
}

function item(v: unknown): PlaybookItem | null {
  if (!isObj(v)) return null;
  const phase = PHASES.includes(v.phase as Phase) ? (v.phase as Phase) : null;
  const id = str(v.id, 64) || createId();
  if (!phase) return null;
  const base = { id, phase };
  // Itens salvos antes de existir lado entram no ataque
  const side: Side = v.side === "defense" ? "defense" : "attack";
  switch (v.kind) {
    case "agent": {
      const at = point(v.at);
      const agentId = str(v.agentId, 64);
      const weaponId = str(v.weaponId, 80);
      return at && agentId ? { ...base, kind: "agent", agentId, side, at, ...(weaponId ? { weaponId } : {}) } : null;
    }
    case "ability": {
      const at = point(v.at);
      const abilityId = str(v.abilityId, 80);
      if (!at || !abilityId) return null;
      const end = point(v.end);
      const ownerId = str(v.ownerId, 64);
      return {
        ...base,
        kind: "ability",
        abilityId,
        side,
        at,
        rotation: num(v.rotation) ? v.rotation : 0,
        ...(end ? { end } : {}),
        ...(ownerId ? { ownerId } : {}),
      };
    }
    case "arrow": {
      const pts = points(v.points, 2);
      return pts ? { ...base, kind: "arrow", points: [pts[0]!, pts[1]!] } : null;
    }
    case "pen": {
      const pts = points(v.points, 2);
      return pts ? { ...base, kind: "pen", points: pts } : null;
    }
    case "area": {
      const pts = points(v.points, 3);
      return pts ? { ...base, kind: "area", points: pts } : null;
    }
    case "text": {
      const at = point(v.at);
      const text = str(v.text, 60)?.trim();
      return at && text ? { ...base, kind: "text", at, text } : null;
    }
    default:
      return null;
  }
}

/** Converte qualquer valor em estratégia válida, ou null se não houver o mínimo (id e mapa). */
export function parsePlaybook(v: unknown): Playbook | null {
  if (!isObj(v)) return null;
  const id = str(v.id, 64);
  const mapId = str(v.mapId, 64);
  if (!id || !mapId) return null;
  const notes = isObj(v.notes) ? v.notes : {};
  const visible = Array.isArray(v.visiblePhases) ? PHASES.filter((p) => (v.visiblePhases as unknown[]).includes(p)) : [...PHASES];
  return {
    id,
    mapId,
    title: str(v.title, 80) ?? "Nova estratégia",
    side: (v.side === "defense" ? "defense" : "attack") as Side,
    rotation: ROTATIONS.includes(v.rotation as Rotation) ? (v.rotation as Rotation) : 0,
    items: Array.isArray(v.items) ? v.items.slice(0, MAX_ITEMS).flatMap((i) => item(i) ?? []) : [],
    visiblePhases: visible,
    background: BACKGROUNDS.includes(v.background as Background) ? (v.background as Background) : "callouts",
    notes: {
      setup: str(notes.setup, 600) ?? "",
      exec: str(notes.exec, 600) ?? "",
      post: str(notes.post, 600) ?? "",
      retake: str(notes.retake, 600) ?? "",
    },
    updatedAt: str(v.updatedAt, 40) ?? new Date().toISOString(),
  };
}

const toBase64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string) => {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export const SHARE_KEY = "s";

/** Codifica a estratégia para o link compartilhável (`#s=`). */
export function encodeShare(p: Playbook): string {
  const rest: Partial<Playbook> = { ...p };
  delete rest.id;
  delete rest.updatedAt;
  return toBase64Url(JSON.stringify(rest));
}

/** Lê a estratégia de um link. Ganha um id novo: quem abre o link edita a própria cópia. */
export function decodeShare(encoded: string): Playbook | null {
  try {
    const data: unknown = JSON.parse(fromBase64Url(encoded));
    return isObj(data) ? parsePlaybook({ ...data, id: createId(), updatedAt: new Date().toISOString() }) : null;
  } catch {
    return null;
  }
}

export function shareUrl(p: Playbook, base = `${location.origin}${location.pathname}`): string {
  return `${base}#${SHARE_KEY}=${encodeShare(p)}`;
}

export function readShareFromHash(hash = location.hash): Playbook | null {
  const encoded = new URLSearchParams(hash.slice(1)).get(SHARE_KEY);
  return encoded ? decodeShare(encoded) : null;
}
