import { parsePlaybook } from "./serialize";
import { createId, type Playbook } from "./types";

export type PlaybookSummary = Pick<Playbook, "id" | "title" | "mapId" | "side" | "updatedAt">;

/** Contrato de persistência. Hoje no navegador; depois, `PUT /playbook/:id` da API. */
export interface PlaybookRepository {
  get(id: string): Promise<Playbook | null>;
  list(): Promise<PlaybookSummary[]>;
  save(playbook: Playbook): Promise<void>;
  duplicate(id: string): Promise<Playbook | null>;
}

const KEY = "sala-tatica:playbooks";

export class LocalPlaybookRepository implements PlaybookRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  private readAll(): Record<string, Playbook> {
    try {
      const raw: unknown = JSON.parse(this.storage.getItem(KEY) ?? "{}");
      if (typeof raw !== "object" || raw === null) return {};
      return Object.fromEntries(
        Object.values(raw).flatMap((v) => {
          const p = parsePlaybook(v);
          return p ? [[p.id, p]] : [];
        }),
      );
    } catch {
      return {};
    }
  }

  private writeAll(all: Record<string, Playbook>) {
    this.storage.setItem(KEY, JSON.stringify(all));
  }

  async get(id: string) {
    return this.readAll()[id] ?? null;
  }

  async list() {
    return Object.values(this.readAll())
      .map(({ id, title, mapId, side, updatedAt }) => ({ id, title, mapId, side, updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async save(playbook: Playbook) {
    const all = this.readAll();
    all[playbook.id] = playbook;
    this.writeAll(all);
  }

  async duplicate(id: string) {
    const original = await this.get(id);
    if (!original) return null;
    const copy: Playbook = {
      ...original,
      id: createId(),
      title: `${original.title} (cópia)`.slice(0, 80),
      updatedAt: new Date().toISOString(),
    };
    await this.save(copy);
    return copy;
  }
}
