import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Image as KImage, Line, Rect } from "react-konva";
import { angleTo, handlePosition, pointAt } from "../../../map/abilityShapes";
import { assetUrl, findAbility, findAgent, findWeapon, type Point } from "../../../map/mapData";
import type { MapContext } from "../../../map/MapCanvas";
import { TagLabel } from "../../../map/TagLabel";
import { useImage } from "../../../map/useImage";
import { withAlpha } from "../../../map/useTokens";
import type { AbilityItem, AgentItem, AreaItem, ArrowItem, PenItem, Phase, PlaybookItem, Side, TextItem } from "../playbook/types";

export type LayerMode = "select" | "erase" | "none";

type Common = {
  ctx: MapContext;
  color: string;
  dim: boolean;
  mode: LayerMode;
  selected: boolean;
  onSelect: (id: string) => void;
  onErase: (id: string) => void;
  onChange: (id: string, patch: Partial<PlaybookItem>, final: boolean) => void;
  onEditText: (id: string) => void;
  onOpenAgent?: (id: string) => void;
};

type LayerProps = Omit<Common, "color" | "dim" | "selected"> & {
  items: PlaybookItem[];
  activePhase: Phase;
  selectedId: string | null;
  phaseColor: (p: Phase) => string;
  sideColor: (s: Side) => string;
};

export function PlaybookLayer({ items, activePhase, selectedId, phaseColor, sideColor, ...rest }: LayerProps) {
  // Agentes e habilidades levam a cor do lado (a habilidade herda o lado de quem a usou);
  // desenhos levam a cor da fase
  const agentSide = new Map(items.flatMap((i) => (i.kind === "agent" ? [[i.id, i.side] as const] : [])));
  const colorOf = (item: PlaybookItem) => {
    if (item.kind === "agent") return sideColor(item.side);
    if (item.kind === "ability") return sideColor((item.ownerId && agentSide.get(item.ownerId)) || item.side);
    return phaseColor(item.phase);
  };
  // A fase em edição fica por cima das outras
  const ordered = [...items.filter((i) => i.phase !== activePhase), ...items.filter((i) => i.phase === activePhase)];
  return (
    <>
      {ordered.map((item) => (
        <ItemView
          key={item.id}
          item={item}
          color={colorOf(item)}
          dim={item.phase !== activePhase}
          selected={item.id === selectedId}
          {...rest}
        />
      ))}
    </>
  );
}

export function ItemView({ item, ...p }: Common & { item: PlaybookItem }) {
  switch (item.kind) {
    case "agent":
      return <AgentMarker item={item} {...p} />;
    case "ability":
      return <AbilityMarker item={item} {...p} />;
    case "arrow":
      return <ArrowShape item={item} {...p} />;
    case "pen":
      return <PenShape item={item} {...p} />;
    case "area":
      return <AreaShape item={item} {...p} />;
    case "text":
      return <TextLabel item={item} {...p} />;
  }
}

const toPx = (pts: Point[], size: number) => pts.flatMap((q) => [q.x * size, q.y * size]);

/** Eventos comuns: selecionar, apagar com a borracha (clicando ou passando com o botão pressionado). */
function useItemEvents(id: string, { mode, onSelect, onErase }: Common) {
  return {
    listening: mode !== "none",
    onPointerDown: () => {
      if (mode === "select") onSelect(id);
      if (mode === "erase") onErase(id);
    },
    onPointerEnter: (e: KonvaEventObject<PointerEvent>) => {
      if (mode === "erase" && e.evt.buttons & 1) onErase(id);
      const stage = e.target.getStage();
      if (stage && mode !== "none") stage.container().style.cursor = mode === "erase" ? "not-allowed" : "move";
    },
    onPointerLeave: (e: KonvaEventObject<PointerEvent>) => {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = "";
    },
  };
}

/** Arrasto de itens com um ponto só: grava a posição nova ao soltar. */
function usePointDrag(id: string, { ctx, mode, onChange }: Common) {
  return {
    draggable: mode === "select",
    onDragEnd: (e: KonvaEventObject<DragEvent>) => {
      const n = e.target;
      onChange(id, { at: { x: n.x() / ctx.size, y: n.y() / ctx.size } }, true);
    },
  };
}

/** Arrasto de itens com vários pontos: desloca todos e devolve o grupo à origem. */
function usePathDrag(item: ArrowItem | PenItem | AreaItem, { ctx, mode, onChange }: Common) {
  return {
    draggable: mode === "select",
    onDragEnd: (e: KonvaEventObject<DragEvent>) => {
      const n = e.target;
      const dx = n.x() / ctx.size;
      const dy = n.y() / ctx.size;
      n.position({ x: 0, y: 0 });
      const points = item.points.map((q) => ({ x: q.x + dx, y: q.y + dy }));
      onChange(item.id, { points } as Partial<PlaybookItem>, true);
    },
  };
}

function SelectionBox({ half, ctx }: { half: number; ctx: MapContext }) {
  const pad = 4 / ctx.zoom;
  return (
    <Rect
      x={-half - pad}
      y={-half - pad}
      width={(half + pad) * 2}
      height={(half + pad) * 2}
      stroke={ctx.tokens.focus}
      strokeWidth={1.5 / ctx.zoom}
      dash={[4 / ctx.zoom, 3 / ctx.zoom]}
      listening={false}
    />
  );
}

/** Quadrado com o canto superior direito cortado, como os cartões. */
const octagonSquare = (h: number, c: number) => [-h + c, -h, h - c, -h, h, -h + c, h, h - c, h - c, h, -h + c, h, -h, h - c, -h, -h + c];
const cutSquare = (half: number, cut: number) => [-half, -half, half - cut, -half, half, -half + cut, half, half, -half, half];

function AgentMarker({ item, ...p }: Common & { item: AgentItem }) {
  const { ctx, color, dim, selected } = p;
  const agent = findAgent(item.agentId);
  const image = useImage(agent ? assetUrl(agent.icon) : undefined);
  const weapon = findWeapon(item.weaponId) ?? null;
  const weaponAbility = !weapon && item.weaponId ? findAbility(item.weaponId)?.ability : undefined;
  const weaponImage = useImage(weapon ? assetUrl(weapon.icon) : weaponAbility ? assetUrl(weaponAbility.icon) : undefined);
  const half = 17 / ctx.zoom;
  const inset = 2 / ctx.zoom;
  // Ataque e defesa não dependem só da cor: a defesa tem os quatro cantos cortados
  const outline = item.side === "defense" ? octagonSquare(half, 7 / ctx.zoom) : cutSquare(half, 6 / ctx.zoom);
  const badgeW = weapon ? 34 / ctx.zoom : 14 / ctx.zoom;
  const badgeH = weapon ? 10 / ctx.zoom : 14 / ctx.zoom;
  return (
    <Group
      x={item.at.x * ctx.size}
      y={item.at.y * ctx.size}
      rotation={ctx.upright}
      opacity={dim ? 0.5 : 1}
      {...useItemEvents(item.id, p)}
      {...usePointDrag(item.id, p)}
      onClick={() => p.mode === "select" && p.onOpenAgent?.(item.id)}
      onTap={() => p.mode === "select" && p.onOpenAgent?.(item.id)}
    >
      <Line points={outline} closed fill={color} />
      <Rect x={-half + inset} y={-half + inset} width={(half - inset) * 2} height={(half - inset) * 2} fill={ctx.tokens.ink900} />
      {image ? <KImage image={image} x={-half + inset} y={-half + inset} width={(half - inset) * 2} height={(half - inset) * 2} /> : null}
      {weaponImage ? (
        <>
          <Rect x={-badgeW / 2 - 2 / ctx.zoom} y={half + 1 / ctx.zoom} width={badgeW + 4 / ctx.zoom} height={badgeH + 4 / ctx.zoom} fill={ctx.tokens.ink900} />
          <KImage image={weaponImage} x={-badgeW / 2} y={half + 3 / ctx.zoom} width={badgeW} height={badgeH} />
        </>
      ) : null}
      {selected ? <SelectionBox half={half} ctx={ctx} /> : null}
    </Group>
  );
}

function AbilityMarker({ item, ...p }: Common & { item: AbilityItem }) {
  const { ctx, color, dim, selected, mode, onChange } = p;
  const found = findAbility(item.abilityId);
  const image = useImage(found ? assetUrl(found.ability.icon) : undefined);
  const shape = found?.ability.shape ?? null;
  const m = ctx.metersToMinimap * ctx.size;
  const origin = { x: 0, y: 0 };
  const stroke = 2 / ctx.zoom;
  const half = 12 / ctx.zoom;
  const end = item.end ? { x: (item.end.x - item.at.x) * ctx.size, y: (item.end.y - item.at.y) * ctx.size } : undefined;
  const handle = handlePosition(shape, origin, item.rotation, end, m);

  const onHandleMove = (e: KonvaEventObject<DragEvent>, final: boolean) => {
    if (!shape) return;
    const local = { x: e.target.x(), y: e.target.y() };
    if (shape.type === "tripwire") {
      const len = Math.hypot(local.x, local.y);
      const max = shape.maxLength * m;
      const k = len > max ? max / len : 1;
      const endPt = { x: item.at.x + (local.x * k) / ctx.size, y: item.at.y + (local.y * k) / ctx.size };
      onChange(item.id, { end: endPt }, final);
    } else {
      onChange(item.id, { rotation: Math.round(angleTo(origin, local)) }, final);
    }
  };

  let body = null;
  if (shape?.type === "area") {
    body = <Circle radius={shape.radius * m} fill={withAlpha(color, 0.22)} stroke={color} strokeWidth={stroke} listening={false} />;
  } else if (shape?.type === "wall") {
    const a = pointAt(origin, item.rotation, (shape.length * m) / 2);
    const b = pointAt(origin, item.rotation + 180, (shape.length * m) / 2);
    body = <Line points={[a.x, a.y, b.x, b.y]} stroke={color} strokeWidth={5 / ctx.zoom} lineCap="square" opacity={0.9} listening={false} />;
  } else if (shape?.type === "direction") {
    const len = shape.length * m;
    const w = shape.width * m;
    const fill = shape.outline ? undefined : withAlpha(color, 0.25);
    const sw = shape.width < 1.5 ? 4 / ctx.zoom : stroke;
    const dash = shape.outline ? [8 / ctx.zoom, 5 / ctx.zoom] : undefined;
    body = (
      <Group rotation={item.rotation} listening={false}>
        {shape.cone ? (
          <Line points={[0, 0, -w / 2, -len, w / 2, -len]} closed fill={fill} stroke={color} strokeWidth={sw} dash={dash} />
        ) : (
          <Rect x={-w / 2} y={-len} width={w} height={len} fill={fill} stroke={color} strokeWidth={sw} dash={dash} />
        )}
      </Group>
    );
  } else if (shape?.type === "tripwire" && end) {
    body = (
      <>
        <Line points={[0, 0, end.x, end.y]} stroke={color} strokeWidth={2.5 / ctx.zoom} dash={[6 / ctx.zoom, 4 / ctx.zoom]} listening={false} />
        <Rect x={end.x - 3 / ctx.zoom} y={end.y - 3 / ctx.zoom} width={6 / ctx.zoom} height={6 / ctx.zoom} fill={color} listening={false} />
      </>
    );
  }

  return (
    <Group
      x={item.at.x * ctx.size}
      y={item.at.y * ctx.size}
      opacity={dim ? 0.5 : 1}
      {...useItemEvents(item.id, p)}
      {...usePointDrag(item.id, p)}
    >
      {body}
      <Group rotation={ctx.upright}>
        <Line points={cutSquare(half, 5 / ctx.zoom)} closed fill={ctx.tokens.ink900} stroke={color} strokeWidth={stroke} />
        {image ? <KImage image={image} x={-half + 3 / ctx.zoom} y={-half + 3 / ctx.zoom} width={(half - 3 / ctx.zoom) * 2} height={(half - 3 / ctx.zoom) * 2} /> : null}
        {selected ? <SelectionBox half={half} ctx={ctx} /> : null}
      </Group>
      {selected && mode === "select" && handle ? (
        <Rect
          x={handle.x}
          y={handle.y}
          offsetX={6 / ctx.zoom}
          offsetY={6 / ctx.zoom}
          width={12 / ctx.zoom}
          height={12 / ctx.zoom}
          fill={ctx.tokens.bone}
          stroke={ctx.tokens.ink900}
          strokeWidth={2 / ctx.zoom}
          draggable
          onDragStart={(e) => {
            e.cancelBubble = true;
          }}
          onDragMove={(e) => {
            e.cancelBubble = true;
            onHandleMove(e, false);
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true;
            onHandleMove(e, true);
          }}
        />
      ) : null}
    </Group>
  );
}

function arrowHead(a: Point, b: Point, len: number) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  return [
    b.x - len * Math.cos(ang - 0.5),
    b.y - len * Math.sin(ang - 0.5),
    b.x,
    b.y,
    b.x - len * Math.cos(ang + 0.5),
    b.y - len * Math.sin(ang + 0.5),
  ];
}

function ArrowShape({ item, ...p }: Common & { item: ArrowItem }) {
  const { ctx, color, dim, selected } = p;
  const [a, b] = item.points.map((q) => ({ x: q.x * ctx.size, y: q.y * ctx.size })) as [Point, Point];
  const w = 4 / ctx.zoom;
  return (
    <Group opacity={dim ? 0.5 : 1} {...useItemEvents(item.id, p)} {...usePathDrag(item, p)}>
      {selected ? <Line points={[a.x, a.y, b.x, b.y]} stroke={ctx.tokens.focus} strokeWidth={w * 3} opacity={0.35} /> : null}
      <Line points={[a.x, a.y, b.x, b.y]} stroke={color} strokeWidth={w} lineCap="square" hitStrokeWidth={16 / ctx.zoom} />
      <Line points={arrowHead(a, b, 16 / ctx.zoom)} stroke={color} strokeWidth={w} lineCap="square" lineJoin="miter" />
    </Group>
  );
}

function PenShape({ item, ...p }: Common & { item: PenItem }) {
  const { ctx, color, dim, selected } = p;
  const pts = toPx(item.points, ctx.size);
  const w = 3 / ctx.zoom;
  return (
    <Group opacity={dim ? 0.5 : 1} {...useItemEvents(item.id, p)} {...usePathDrag(item, p)}>
      {selected ? <Line points={pts} stroke={ctx.tokens.focus} strokeWidth={w * 3} opacity={0.35} tension={0.3} /> : null}
      <Line points={pts} stroke={color} strokeWidth={w} tension={0.3} lineCap="round" lineJoin="round" hitStrokeWidth={14 / ctx.zoom} />
    </Group>
  );
}

function AreaShape({ item, ...p }: Common & { item: AreaItem }) {
  const { ctx, color, dim, selected } = p;
  return (
    <Group opacity={dim ? 0.5 : 1} {...useItemEvents(item.id, p)} {...usePathDrag(item, p)}>
      <Line
        points={toPx(item.points, ctx.size)}
        closed
        fill={withAlpha(color, 0.3)}
        stroke={selected ? ctx.tokens.focus : color}
        strokeWidth={2 / ctx.zoom}
        dash={[8 / ctx.zoom, 6 / ctx.zoom]}
      />
    </Group>
  );
}

function TextLabel({ item, ...p }: Common & { item: TextItem }) {
  const { ctx, color, dim, selected, mode, onEditText } = p;
  return (
    <TagLabel
      x={item.at.x * ctx.size}
      y={item.at.y * ctx.size}
      rotation={ctx.upright}
      opacity={dim ? 0.5 : 1}
      text={item.text}
      fontSize={13 / ctx.zoom}
      color={color}
      background={ctx.tokens.ink900}
      stroke={selected ? ctx.tokens.focus : undefined}
      onDblClick={() => mode === "select" && onEditText(item.id)}
      {...useItemEvents(item.id, p)}
      {...usePointDrag(item.id, p)}
    />
  );
}
