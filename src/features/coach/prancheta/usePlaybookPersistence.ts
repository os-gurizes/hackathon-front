import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DEFAULT_MAP, findMap } from "../../../map/mapData";
import { historyReducer, initHistory } from "../playbook/history";
import { LocalPlaybookRepository, type PlaybookRepository, type PlaybookSummary } from "../playbook/repository";
import { readShareFromHash, shareUrl } from "../playbook/serialize";
import { newPlaybook, type Playbook } from "../playbook/types";

export const AUTOSAVE_MS = 1500;
const NOTICE_MS = 4000;
const PARAM = "e";
const SHARED_NOTICE = "Estratégia aberta pelo link. Esta é a sua cópia: o que você mudar não altera a original.";

export type SaveStatus = "loading" | "saving" | "saved" | "error";

const defaultRepo = new LocalPlaybookRepository();

// O mesmo link vira sempre a mesma cópia, mesmo que a abertura rode duas vezes
let sharedCache: { hash: string; playbook: Playbook | null } | null = null;
function sharedFromHash(): Playbook | null {
  const hash = window.location.hash;
  if (sharedCache?.hash !== hash) sharedCache = { hash, playbook: readShareFromHash(hash) };
  return sharedCache.playbook;
}

/** Deixa o id da estratégia aberta na URL, para recarregar a página no mesmo lugar. */
function syncUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, id);
  url.hash = "";
  window.history.replaceState(null, "", url);
}

export function usePlaybookPersistence(repo: PlaybookRepository = defaultRepo) {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => initHistory(newPlaybook(DEFAULT_MAP)));
  const playbook = history.present;
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Playbook | null>(null);
  const [failed, setFailed] = useState(false);
  const [list, setList] = useState<PlaybookSummary[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(playbook);

  useEffect(() => {
    latest.current = playbook;
  }, [playbook]);

  const persist = useCallback(
    async (p: Playbook) => {
      try {
        await repo.save(p);
        setSaved(p);
        setFailed(false);
        setList(await repo.list());
      } catch {
        // Armazenamento cheio ou bloqueado: a prancheta continua funcionando sem salvar
        setFailed(true);
      }
    },
    [repo],
  );

  const open = useCallback(
    async (p: Playbook, message?: string) => {
      await persist(p);
      dispatch({ type: "replace", playbook: p });
      syncUrl(p.id);
      if (message) setNotice(message);
    },
    [persist],
  );

  // Abertura: link compartilhado, depois o id da URL, depois a mais recente, depois uma nova
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const shared = sharedFromHash();
      let initial: Playbook | null = shared;
      let message: string | undefined;
      if (shared) {
        message = SHARED_NOTICE;
      } else {
        const id = new URL(window.location.href).searchParams.get(PARAM);
        initial = id ? await repo.get(id) : null;
        if (!initial) {
          const [recent] = await repo.list();
          initial = recent ? await repo.get(recent.id) : null;
        }
      }
      if (cancelled) return;
      await open(initial ?? newPlaybook(DEFAULT_MAP), message);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [repo, open]);

  // Link colado na mesma aba: só o hash muda e a página não recarrega
  useEffect(() => {
    const onHash = () => {
      const shared = sharedFromHash();
      if (shared) void persist(latest.current).then(() => open(shared, SHARED_NOTICE));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open, persist]);

  // Salvamento automático com debounce
  useEffect(() => {
    if (!ready || playbook === saved) return;
    const t = setTimeout(() => void persist(playbook), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [ready, playbook, saved, persist]);

  // Fechar a aba no meio do debounce não perde a última mudança
  useEffect(() => {
    const flush = () => {
      if (ready) void repo.save(latest.current);
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [ready, repo]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  const status: SaveStatus = !ready ? "loading" : failed ? "error" : playbook === saved ? "saved" : "saving";

  const openById = async (id: string) => {
    await persist(latest.current);
    const p = await repo.get(id);
    if (p) await open(p);
  };

  const createNew = async () => {
    await persist(latest.current);
    await open(newPlaybook(findMap(latest.current.mapId) ?? DEFAULT_MAP), "Nova estratégia criada.");
  };

  const duplicate = async () => {
    await persist(latest.current);
    const copy = await repo.duplicate(latest.current.id);
    if (copy) await open(copy, "Cópia criada. Você está editando a cópia.");
  };

  const share = async () => {
    const url = shareUrl(latest.current);
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copiado. Quem abrir recebe uma cópia desta estratégia.");
    } catch {
      // A área de transferência pode estar bloqueada: o link fica visível para copiar à mão
      window.prompt("Copie o link da estratégia:", url);
    }
  };

  return { history, dispatch, status, list, notice, notify: setNotice, ready, openById, createNew, duplicate, share };
}
