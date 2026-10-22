import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Group, Image as KImage, Layer, Rect, Stage } from "react-konva";
import { TagLabel } from "./TagLabel";
import { cx } from "../design/cx";
import { assetUrl, type MapInfo, type Point, type Rotation } from "./mapData";
import { clampView, IDENTITY_VIEW, mapToScreen, screenToMap, zoomAt, type View } from "./transform";
import { useImage } from "./useImage";
import { useTokens, type Tokens } from "./useTokens";
import styles from "./MapCanvas.module.css";

/** O que as camadas recebem para desenhar no espaço do mapa (pixels sem rotação). */
export type MapContext = {
  size: number;
  zoom: number;
  /** Rotação que mantém em pé textos e ícones dentro do mapa girado. */
  upright: number;
  tokens: Tokens;
  metersToMinimap: number;
};

export type MapPointerEvent = {
  point: Point;
  onBackground: boolean;
  evt: PointerEvent;
};

type Props = {
  map: MapInfo;
  rotation: Rotation;
  showCallouts: boolean;
  /** Arrastar o fundo move o mapa. O botão do meio sempre move. */
  panOnBackground: boolean;
  cursor?: string;
  label: string;
  stageRef?: Ref<Konva.Stage>;
  onPointerDown?: (e: MapPointerEvent) => void;
  onPointerMove?: (e: MapPointerEvent) => void;
  onPointerUp?: (e: MapPointerEvent) => void;
  children?: (ctx: MapContext) => ReactNode;
  overlay?: (toScreen: (p: Point) => Point, size: number) => ReactNode;
};

const BG = "map-bg";
const isBackground = (target: Konva.Node) => target.getType() === "Stage" || target.hasName(BG);

export function MapCanvas({
  map,
  rotation,
  showCallouts,
  panOnBackground,
  cursor,
  label,
  stageRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  children,
  overlay,
}: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  // Trocar de mapa ou girar volta para a vista inteira
  const viewKey = `${map.id}:${rotation}`;
  const [viewState, setViewState] = useState({ key: viewKey, view: IDENTITY_VIEW });
  const view = viewState.key === viewKey ? viewState.view : IDENTITY_VIEW;
  const setView = (next: View | ((v: View) => View)) =>
    setViewState((s) => {
      const current = s.key === viewKey ? s.view : IDENTITY_VIEW;
      return { key: viewKey, view: typeof next === "function" ? next(current) : next };
    });
  const [panning, setPanning] = useState(false);
  const pan = useRef<{ start: Point; view: View } | null>(null);
  const pressed = useRef(false);
  const lastPoint = useRef<Point>({ x: 0.5, y: 0.5 });
  const tokens = useTokens();
  const minimap = useImage(assetUrl(map.minimap));

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry?.contentRect.width ?? 0);
      setSize(w);
      setViewState((s) => ({ ...s, view: clampView(s.view, w) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Soltar o botão fora do canvas também encerra o gesto
  useEffect(() => {
    const up = (evt: PointerEvent) => {
      if (!pressed.current) return;
      pressed.current = false;
      if (pan.current) {
        pan.current = null;
        setPanning(false);
        return;
      }
      onPointerUp?.({ point: lastPoint.current, onBackground: false, evt });
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [onPointerUp]);

  const pointerOf = (e: KonvaEventObject<PointerEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition() ?? { x: 0, y: 0 };
    return { screen: pos, map: screenToMap(pos, rotation, view, size) };
  };

  const handleDown = (e: KonvaEventObject<PointerEvent>) => {
    const { screen, map: point } = pointerOf(e);
    const onBackground = isBackground(e.target);
    pressed.current = true;
    lastPoint.current = point;
    if (e.evt.button === 1 || (panOnBackground && onBackground && e.evt.button === 0)) {
      e.evt.preventDefault();
      pan.current = { start: screen, view };
      setPanning(true);
      return;
    }
    if (e.evt.button === 0) onPointerDown?.({ point, onBackground, evt: e.evt });
  };

  const handleMove = (e: KonvaEventObject<PointerEvent>) => {
    const { screen, map: point } = pointerOf(e);
    lastPoint.current = point;
    if (pan.current) {
      const { start, view: v } = pan.current;
      setView(clampView({ zoom: v.zoom, x: v.x + screen.x - start.x, y: v.y + screen.y - start.y }, size));
      return;
    }
    onPointerMove?.({ point, onBackground: isBackground(e.target), evt: e.evt });
  };

  const handleUp = (e: KonvaEventObject<PointerEvent>) => {
    if (!pressed.current) return;
    pressed.current = false;
    if (pan.current) {
      pan.current = null;
      setPanning(false);
      return;
    }
    const { map: point } = pointerOf(e);
    onPointerUp?.({ point, onBackground: isBackground(e.target), evt: e.evt });
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    const factor = Math.exp(-e.evt.deltaY * 0.0015);
    setView((v) => zoomAt(v, pos, v.zoom * factor, size));
  };

  const zoomBy = (factor: number) => setView((v) => zoomAt(v, { x: size / 2, y: size / 2 }, v.zoom * factor, size));

  const ctx: MapContext = { size, zoom: view.zoom, upright: -rotation, tokens, metersToMinimap: map.metersToMinimap };
  const toScreen = (p: Point) => mapToScreen(p, rotation, view, size);
  const calloutFont = 10 / view.zoom;

  return (
    <div className={styles.wrap}>
      <div ref={frame} className={cx(styles.frame, "st-cut")} style={{ cursor: panning ? "grabbing" : cursor }}>
        <div className={styles.stage} role="img" aria-label={label}>
        {size > 0 ? (
          <Stage
            ref={stageRef}
            width={size}
            height={size}
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.evt.preventDefault()}
          >
            <Layer>
              <Group x={view.x} y={view.y} scaleX={view.zoom} scaleY={view.zoom}>
                <Group x={size / 2} y={size / 2} offsetX={size / 2} offsetY={size / 2} rotation={rotation}>
                  <Rect name={BG} width={size} height={size} fill={tokens.ink800} />
                  {minimap ? <KImage name={BG} image={minimap} width={size} height={size} /> : null}
                  <Rect width={size} height={size} fill={tokens.ink900} opacity={0.45} listening={false} />
                  {showCallouts
                    ? map.callouts.map((c, i) => (
                        <TagLabel
                          key={i}
                          x={c.x * size}
                          y={c.y * size}
                          rotation={-rotation}
                          listening={false}
                          opacity={c.kind === "region" ? 0.85 : 1}
                          text={c.label}
                          fontSize={c.kind === "region" ? calloutFont : calloutFont * 1.4}
                          background={tokens.ink900}
                          color={c.side === "attack" ? tokens.signal : c.side === "defense" ? tokens.cyan : tokens.bone}
                        />
                      ))
                    : null}
                  {children?.(ctx)}
                </Group>
              </Group>
            </Layer>
          </Stage>
        ) : null}
        </div>
        {size > 0 ? overlay?.(toScreen, size) : null}
        <div className={styles.zoom} role="group" aria-label="Zoom">
          <button type="button" className={styles.zoomBtn} onClick={() => zoomBy(1.4)} aria-label="Aproximar" title="Aproximar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button type="button" className={styles.zoomBtn} onClick={() => zoomBy(1 / 1.4)} aria-label="Afastar" title="Afastar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>
          <span className={styles.zoomValue}>{view.zoom.toFixed(1).replace(".", ",")}x</span>
        </div>
      </div>
    </div>
  );
}
