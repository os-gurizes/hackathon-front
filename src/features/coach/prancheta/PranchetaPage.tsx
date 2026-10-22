import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { cx } from "../../../design/cx";
import { Button, Icon, Select } from "../../../design/primitives";
import { pointAt } from "../../../map/abilityShapes";
import { AGENTS, assetUrl, DEFAULT_MAP, findAbility, findMap, type Point } from "../../../map/mapData";
import { MapCanvas, type MapPointerEvent } from "../../../map/MapCanvas";
import { nextRotation } from "../../../map/transform";
import { useTokens } from "../../../map/useTokens";
import { canJoin, MAX_PER_SIDE, teamOf } from "../playbook/composition";
import { createId, PHASES, type AgentItem, type Phase, type PlaybookItem, type Side } from "../playbook/types";
import { AgentPopover } from "./AgentPopover";
import { usePlaybookPersistence, type SaveStatus } from "./usePlaybookPersistence";
import { ItemView, PlaybookLayer, type LayerMode } from "./PlaybookLayer";
import { CompositionPanel, MapPanel, NotesPanel, PhasesPanel, PiecesPanel } from "./Panels";
import { distance, octagon, PHASE_INFO, roundPoint, TOOLS, type Tool } from "./tools";
import styles from "./PranchetaPage.module.css";

type Live = { id: string; patch: Partial<PlaybookItem> } | null;
type TextEdit = { id?: string; at: Point; value: string } | null;

const PRESENT_STEP_MS = 1600;

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);

export default function PranchetaPage() {
  const { history, dispatch, status, list, notice, notify, ready, openById, createNew, duplicate, share } = usePlaybookPersistence();
  const playbook = history.present;
  const map = findMap(playbook.mapId) ?? DEFAULT_MAP;
  const tokens = useTokens();

  const [tool, setTool] = useState<Tool>("select");
  const [activePhase, setActivePhase] = useState<Phase>("setup");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState(AGENTS.find((a) => a.name === "Jett")?.id ?? AGENTS[0]!.id);
  const [abilityId, setAbilityId] = useState<string | null>(null);
  const [placeSide, setPlaceSide] = useState<Side>("attack");
  const [popoverId, setPopoverId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaybookItem | null>(null);
  const [live, setLive] = useState<Live>(null);
  const [textEdit, setTextEdit] = useState<TextEdit>(null);
  const [presenting, setPresenting] = useState<number | null>(null);
  const areaCenter = useRef<Point | null>(null);
  const pendingText = useRef<Point | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const phaseColor = useCallback(
    (p: Phase) => ({ setup: tokens.boneMuted, exec: tokens.signal, post: tokens.gold, retake: tokens.cyan })[p],
    [tokens],
  );

  const sideColor = useCallback((s: Side) => (s === "attack" ? tokens.signal : tokens.cyan), [tokens]);
  const sideName = (s: Side) => (s === "attack" ? "ataque" : "defesa");
  const fullSides = (["attack", "defense"] as const).filter((s) => teamOf(playbook.items, s).agents.length >= MAX_PER_SIDE);

  /** Coloca uma habilidade; as que têm direção já ficam selecionadas para mirar pela alça. */
  const placeAbility = (id: string, at: Point, phase: Phase, side: Side, ownerId?: string) => {
    const shape = findAbility(id)?.ability.shape ?? null;
    // Nasce apontando para cima na tela, qualquer que seja a rotação do mapa
    const rotation = -playbook.rotation;
    const end = shape?.type === "tripwire" ? roundPoint(pointAt(at, rotation + 90, 5 * map.metersToMinimap)) : undefined;
    const item: PlaybookItem = { id: createId(), phase, kind: "ability", abilityId: id, side, at, rotation, ...(end ? { end } : {}), ...(ownerId ? { ownerId } : {}) };
    add(item);
    return { item, aim: shape != null && shape.type !== "area" };
  };

  const placeAgent = (id: string, at: Point) => {
    if (!canJoin(playbook.items, id, placeSide)) {
      notify(`O ${sideName(placeSide)} já tem ${MAX_PER_SIDE} agentes. Remova um ou troque o lado de quem entra.`);
      return;
    }
    add({ id: createId(), phase: activePhase, kind: "agent", agentId: id, side: placeSide, at });
  };

  // Habilidades pelo menu do agente nascem em volta dele, sem empilhar
  const abilityNearAgent = (owner: AgentItem, id: string) => {
    const count = playbook.items.filter((i) => i.kind === "ability" && i.ownerId === owner.id).length;
    const angle = ((count * 60 - 30) * Math.PI) / 180;
    const at = roundPoint({ x: owner.at.x + Math.cos(angle) * 0.04, y: owner.at.y + Math.sin(angle) * 0.04 });
    placeAbility(id, at, owner.phase, owner.side, owner.id);
  };

  const popoverItem = playbook.items.find((i): i is AgentItem => i.id === popoverId && i.kind === "agent");
  const showPopover = popoverItem != null && popoverId === selectedId && tool === "select" && presenting == null;

  const shownPhase = presenting != null ? PHASES[presenting]! : activePhase;
  const visible = presenting != null ? PHASES.slice(0, presenting + 1) : playbook.visiblePhases;
  const items = useMemo(
    () =>
      playbook.items
        .filter((i) => visible.includes(i.phase))
        .map((i) => (live && i.id === live.id ? ({ ...i, ...live.patch } as PlaybookItem) : i)),
    [playbook.items, visible, live],
  );

  // Apresentação: percorre as fases acumulando as camadas
  useEffect(() => {
    if (presenting == null) return;
    const t = setTimeout(() => setPresenting(presenting + 1 < PHASES.length ? presenting + 1 : null), PRESENT_STEP_MS);
    return () => clearTimeout(t);
  }, [presenting]);

  const pickTool = (t: Tool) => {
    setTool(t);
    setDraft(null);
    if (t !== "select") setSelectedId(null);
    if (t === "ability" && !abilityId) {
      const first = AGENTS.find((a) => a.id === agentId)?.abilities[0];
      if (first) setAbilityId(first.id);
    }
  };

  const pickPhase = (p: Phase) => {
    setActivePhase(p);
    if (!playbook.visiblePhases.includes(p)) dispatch({ type: "set", patch: { visiblePhases: [...playbook.visiblePhases, p] } });
  };

  const add = (item: PlaybookItem) => dispatch({ type: "add", item });

  const onChange = useCallback((id: string, patch: Partial<PlaybookItem>, final: boolean) => {
    if (final) {
      setLive(null);
      dispatch({ type: "update", id, patch });
    } else {
      setLive({ id, patch });
    }
  }, [dispatch]);

  const onErase = useCallback((id: string) => {
    dispatch({ type: "remove", id });
    setSelectedId((s) => (s === id ? null : s));
  }, [dispatch, setSelectedId]);

  const onEditText = useCallback(
    (id: string) => {
      const item = playbook.items.find((i) => i.id === id);
      if (item?.kind === "text") setTextEdit({ id, at: item.at, value: item.text });
    },
    [playbook.items, setTextEdit],
  );

  const handleDown = ({ point, onBackground }: MapPointerEvent) => {
    const p = roundPoint(point);
    const base = { id: createId(), phase: activePhase };
    switch (tool) {
      case "select":
        if (onBackground) setSelectedId(null);
        return;
      case "pen":
        setDraft({ ...base, kind: "pen", points: [p] });
        return;
      case "arrow":
        setDraft({ ...base, kind: "arrow", points: [p, p] });
        return;
      case "area":
        areaCenter.current = p;
        setDraft({ ...base, kind: "area", points: octagon(p, 0) });
        return;
      case "agent":
        placeAgent(agentId, p);
        return;
      case "ability": {
        if (!abilityId) return;
        const { item, aim } = placeAbility(abilityId, p, activePhase, placeSide);
        if (aim) {
          setTool("select");
          setSelectedId(item.id);
        }
        return;
      }
      case "text":
        pendingText.current = p;
        return;
      case "eraser":
        return;
    }
  };

  const handleMove = ({ point }: MapPointerEvent) => {
    if (!draft) return;
    const p = roundPoint(point);
    if (draft.kind === "pen") {
      const last = draft.points.at(-1);
      if (last && distance(last, p) > 0.004) setDraft({ ...draft, points: [...draft.points, p] });
    } else if (draft.kind === "arrow") {
      setDraft({ ...draft, points: [draft.points[0], p] });
    } else if (draft.kind === "area" && areaCenter.current) {
      setDraft({ ...draft, points: octagon(areaCenter.current, distance(areaCenter.current, p)).map(roundPoint) });
    }
  };

  const handleUp = ({ point }: MapPointerEvent) => {
    // O campo de texto abre ao soltar o botão: aberto no pointerdown, o clique tiraria o foco dele
    if (tool === "text" && pendingText.current) {
      setTextEdit({ at: pendingText.current, value: "" });
      pendingText.current = null;
      return;
    }
    const d = draft;
    const center = areaCenter.current;
    areaCenter.current = null;
    setDraft(null);
    if (!d) return;
    let item: PlaybookItem = d;
    if (d.kind === "arrow") item = { ...d, points: [d.points[0], roundPoint(point)] };
    if (d.kind === "area" && center) item = { ...d, points: octagon(center, distance(center, point)).map(roundPoint) };
    const valid =
      (item.kind === "pen" && item.points.length > 1) ||
      (item.kind === "arrow" && distance(item.points[0], item.points[1]) > 0.015) ||
      (item.kind === "area" && center != null && distance(center, point) > 0.01);
    if (valid) dispatch({ type: "add", item });
  };

  const commitText = () => {
    if (!textEdit) return;
    const text = textEdit.value.trim();
    if (textEdit.id) {
      if (text) dispatch({ type: "update", id: textEdit.id, patch: { text } });
      else dispatch({ type: "remove", id: textEdit.id });
    } else if (text) {
      add({ id: createId(), phase: activePhase, kind: "text", at: textEdit.at, text });
    }
    setTextEdit(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        onErase(selectedId);
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setDraft(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onErase, dispatch]);

  const exportPng = () => {
    const url = stageRef.current?.toDataURL({ pixelRatio: 2 });
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${playbook.title.trim() || "estrategia"}.png`;
    a.click();
  };

  const mode: LayerMode = presenting != null ? "none" : tool === "select" ? "select" : tool === "eraser" ? "erase" : "none";
  const toolInfo = TOOLS.find((t) => t.id === tool)!;
  const sideLabel = playbook.side === "attack" ? "Ataque" : "Defesa";

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <span className={styles.kicker}>
            <img src={assetUrl(map.banner)} alt="" width={96} height={21} className={styles.banner} />
            {map.name} · {sideLabel}
          </span>
          <label className="st-visually-hidden" htmlFor="playbook-title">
            Nome da estratégia
          </label>
          <input
            id="playbook-title"
            className={styles.title}
            value={playbook.title}
            maxLength={80}
            onChange={(e) => dispatch({ type: "set", patch: { title: e.target.value } })}
          />
        </div>
        <div className={styles.actions}>
          <SaveIndicator status={status} />
          <Select
            label="Estratégias salvas"
            className={styles.picker}
            value={playbook.id}
            disabled={!ready}
            options={(list.some((s) => s.id === playbook.id) ? list : [playbook, ...list]).map((s) => ({
              value: s.id,
              label: `${s.title.trim() || "Sem nome"} · ${findMap(s.mapId)?.name ?? "Mapa"}`,
            }))}
            onChange={(id) => {
              setSelectedId(null);
              void openById(id);
            }}
          />
          <Button variant="ghost" icon="pencil" disabled={!ready} onClick={() => void createNew()}>
            Nova
          </Button>
          <Button variant="ghost" icon="layers" disabled={!ready} onClick={() => void duplicate()}>
            Duplicar
          </Button>
          <Button variant="secondary" icon="save" onClick={exportPng}>
            Exportar PNG
          </Button>
          <Button variant="primary" icon="share" disabled={!ready} onClick={() => void share()}>
            Compartilhar com o elenco
          </Button>
        </div>
      </div>
      <div role="status" aria-live="polite" className={cx(styles.notice, notice && styles.noticeOn)}>
        {notice}
      </div>

      <div className={styles.body}>
        <aside className={styles.left} aria-label="Composição, fases e notas">
          <CompositionPanel
            playbook={playbook}
            onAgent={(id) => {
              setAgentId(id);
              setAbilityId(null);
              pickTool("agent");
            }}
          />
          <PhasesPanel
            playbook={playbook}
            activePhase={activePhase}
            presenting={presenting}
            onPick={pickPhase}
            onToggle={(p) =>
              dispatch({
                type: "set",
                patch: {
                  visiblePhases: playbook.visiblePhases.includes(p)
                    ? playbook.visiblePhases.filter((v) => v !== p)
                    : [...playbook.visiblePhases, p],
                },
              })
            }
            onPresent={() => setPresenting(presenting == null ? 0 : null)}
            onClear={() => dispatch({ type: "clearPhase", phase: activePhase })}
          />
          <NotesPanel
            phase={activePhase}
            value={playbook.notes[activePhase]}
            onChange={(text) => dispatch({ type: "set", patch: { notes: { ...playbook.notes, [activePhase]: text } } })}
          />
        </aside>

        <div className={styles.center}>
        <div role="toolbar" aria-label="Ferramentas de desenho" aria-orientation="vertical" className={cx(styles.toolbar, "st-cut")}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cx(styles.tool, tool === t.id && styles.toolOn)}
              aria-label={t.label}
              title={t.label}
              aria-pressed={tool === t.id}
              onClick={() => pickTool(t.id)}
            >
              <Icon name={t.icon} size={20} />
            </button>
          ))}
          <span className={styles.toolSep} />
          <button type="button" className={styles.tool} aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!history.past.length} onClick={() => dispatch({ type: "undo" })}>
            <Icon name="undo" size={20} />
          </button>
          <button type="button" className={styles.tool} aria-label="Refazer" title="Refazer (Ctrl+Y)" disabled={!history.future.length} onClick={() => dispatch({ type: "redo" })}>
            <Icon name="redo" size={20} />
          </button>
          <button
            type="button"
            className={styles.tool}
            aria-label="Girar o mapa"
            title="Girar o mapa 90 graus"
            onClick={() => dispatch({ type: "set", patch: { rotation: nextRotation(playbook.rotation) } })}
          >
            <Icon name="rotate" size={20} />
          </button>
        </div>

        <div className={styles.canvasCol}>
          <MapCanvas
            map={map}
            rotation={playbook.rotation}
            showCallouts={playbook.background === "callouts"}
            panOnBackground={tool === "select"}
            cursor={tool === "select" ? "grab" : tool === "eraser" ? "not-allowed" : "crosshair"}
            label={`Prancheta sobre o minimapa de ${map.name}`}
            stageRef={stageRef}
            onPointerDown={presenting == null ? handleDown : undefined}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            overlay={(toScreen, frameSize) =>
              showPopover && popoverItem ? (
                <AgentPopover
                  key={popoverItem.id}
                  item={popoverItem}
                  anchor={toScreen(popoverItem.at)}
                  frameSize={frameSize}
                  fullSides={fullSides.filter((s) => !teamOf(playbook.items, s).agents.some((a) => a.id === popoverItem.agentId))}
                  onSide={(side) => dispatch({ type: "update", id: popoverItem.id, patch: { side } })}
                  onAbility={(id) => abilityNearAgent(popoverItem, id)}
                  onWeapon={(weaponId) =>
                    dispatch({ type: "update", id: popoverItem.id, patch: weaponId ? { weaponId } : { weaponId: undefined } })
                  }
                  onRemove={() => {
                    onErase(popoverItem.id);
                    setPopoverId(null);
                  }}
                  onClose={() => setPopoverId(null)}
                />
              ) : textEdit ? (
                <input
                  autoFocus
                  aria-label="Texto na prancheta"
                  className={styles.textEditor}
                  style={{ left: toScreen(textEdit.at).x, top: toScreen(textEdit.at).y }}
                  value={textEdit.value}
                  maxLength={60}
                  placeholder="Escreva e tecle Enter"
                  onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitText();
                    if (e.key === "Escape") setTextEdit(null);
                  }}
                  onBlur={commitText}
                />
              ) : null
            }
          >
            {(ctx) => (
              <>
                <PlaybookLayer
                  items={items}
                  activePhase={shownPhase}
                  selectedId={selectedId}
                  phaseColor={phaseColor}
                  sideColor={sideColor}
                  onOpenAgent={(id) => {
                    setSelectedId(id);
                    setPopoverId(id);
                  }}
                  ctx={ctx}
                  mode={mode}
                  onSelect={setSelectedId}
                  onErase={onErase}
                  onChange={onChange}
                  onEditText={onEditText}
                />
                {draft ? (
                  <ItemView
                    item={draft}
                    ctx={ctx}
                    color={phaseColor(draft.phase)}
                    dim={false}
                    mode="none"
                    selected={false}
                    onSelect={setSelectedId}
                    onErase={onErase}
                    onChange={onChange}
                    onEditText={onEditText}
                  />
                ) : null}
              </>
            )}
          </MapCanvas>
          <p className={styles.caption}>
            Ferramenta ativa: {toolInfo.label}. Fase em edição: {PHASE_INFO[activePhase].name}.{" "}
            {tool === "select"
              ? "Arraste o fundo para mover o mapa e use a roda do mouse para dar zoom."
              : tool === "ability" || tool === "agent"
                ? "Escolha a peça no painel ao lado e clique no mapa."
                : "Use a roda do mouse para dar zoom."}
          </p>
        </div>
        </div>

        <aside className={styles.right} aria-label="Agentes, habilidades e mapa">
          <PiecesPanel
            agentId={agentId}
            abilityId={tool === "ability" ? abilityId : null}
            placeSide={placeSide}
            onPlaceSide={setPlaceSide}
            onAgent={(id) => {
              setAgentId(id);
              setAbilityId(null);
              pickTool("agent");
            }}
            onAbility={(id) => {
              setAbilityId(id);
              setTool("ability");
              setSelectedId(null);
            }}
          />
          <MapPanel
            playbook={playbook}
            onMap={(id) => {
              const next = findMap(id);
              if (next) dispatch({ type: "changeMap", mapId: next.id, rotation: next.attackDownRotation });
            }}
            onSide={(side) => dispatch({ type: "set", patch: { side } })}
            onBackground={(background) => dispatch({ type: "set", patch: { background } })}
          />
        </aside>
      </div>
    </div>
  );
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  loading: "Abrindo",
  saving: "Salvando",
  saved: "Salvo",
  error: "Não foi possível salvar neste navegador",
};

function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <span className={cx(styles.saved, status === "error" && styles.savedError)} data-status={status}>
      <Icon name={status === "error" ? "alert" : "save"} size={16} />
      {STATUS_TEXT[status]}
    </span>
  );
}
