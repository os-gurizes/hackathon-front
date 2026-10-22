import type { Phase, Playbook, PlaybookItem } from "./types";

const LIMIT = 100;

export type History = { past: Playbook[]; present: Playbook; future: Playbook[] };

export type PlaybookAction =
  | { type: "add"; item: PlaybookItem }
  | { type: "update"; id: string; patch: Partial<PlaybookItem> }
  | { type: "remove"; id: string }
  | { type: "clearPhase"; phase: Phase }
  | { type: "changeMap"; mapId: string; rotation: Playbook["rotation"] }
  // Mudanças de vista e de texto não entram na pilha de desfazer
  | { type: "set"; patch: Partial<Omit<Playbook, "id" | "items">> }
  | { type: "replace"; playbook: Playbook }
  | { type: "undo" }
  | { type: "redo" };

export const initHistory = (present: Playbook): History => ({ past: [], present, future: [] });

const touch = (p: Playbook): Playbook => ({ ...p, updatedAt: new Date().toISOString() });

function commit(h: History, next: Playbook): History {
  if (next === h.present) return h;
  return { past: [...h.past, h.present].slice(-LIMIT), present: touch(next), future: [] };
}

function restore(current: Playbook, snapshot: Playbook): Playbook {
  const mapChanged = snapshot.mapId !== current.mapId;
  return {
    ...current,
    items: snapshot.items,
    mapId: snapshot.mapId,
    rotation: mapChanged ? snapshot.rotation : current.rotation,
  };
}

function editItems(p: Playbook, items: PlaybookItem[]): Playbook {
  return items === p.items ? p : { ...p, items };
}

export function historyReducer(h: History, action: PlaybookAction): History {
  const p = h.present;
  switch (action.type) {
    case "add":
      return commit(h, editItems(p, [...p.items, action.item]));
    case "update": {
      if (!p.items.some((i) => i.id === action.id)) return h;
      return commit(
        h,
        editItems(
          p,
          p.items.map((i) => (i.id === action.id ? ({ ...i, ...action.patch } as PlaybookItem) : i)),
        ),
      );
    }
    case "remove": {
      if (!p.items.some((i) => i.id === action.id)) return h;
      return commit(h, editItems(p, p.items.filter((i) => i.id !== action.id)));
    }
    case "clearPhase": {
      if (!p.items.some((i) => i.phase === action.phase)) return h;
      return commit(h, editItems(p, p.items.filter((i) => i.phase !== action.phase)));
    }
    case "changeMap":
      if (action.mapId === p.mapId) return h;
      return commit(h, { ...p, mapId: action.mapId, rotation: action.rotation, items: [] });
    case "set":
      return { ...h, present: touch({ ...p, ...action.patch }) };
    case "replace":
      return initHistory(action.playbook);
    // Desfazer mexe só no que entra na pilha (itens e mapa); vista, título e notas ficam como estão
    case "undo": {
      const prev = h.past.at(-1);
      if (!prev) return h;
      return { past: h.past.slice(0, -1), present: touch(restore(p, prev)), future: [p, ...h.future] };
    }
    case "redo": {
      const [next, ...rest] = h.future;
      if (!next) return h;
      return { past: [...h.past, p], present: touch(restore(p, next)), future: rest };
    }
  }
}
