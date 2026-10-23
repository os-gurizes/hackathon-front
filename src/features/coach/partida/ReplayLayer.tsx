import { Circle, Group, Image as KImage, Line, Rect } from "react-konva";
import type { MapContext } from "../../../map/MapCanvas";
import { AGENTS, assetUrl } from "../../../map/mapData";
import { useImage } from "../../../map/useImage";
import { deathsUntil, isKill, snapshotAt, spikeAt, type ReplayEvent, type ReplayPlayer } from "./replay";

type Props = { ctx: MapContext; events: ReplayEvent[]; players: ReplayPlayer[]; index: number };

/** Replay 2D de um round: posições de todos no passo atual, mortes até ali, o abate atual e a spike. */
export function ReplayLayer({ ctx, events, players, index }: Props) {
  const { size, zoom, tokens } = ctx;
  const sideOf = new Map(players.map((p) => [p.player.id, p.side]));
  const color = (playerId: number) => (sideOf.get(playerId) === "attack" ? tokens.signal : tokens.cyan);
  const px = (p: { x: number; y: number }) => [p.x * size, p.y * size] as const;
  const current = events[index];
  const x = 6 / zoom;

  return (
    <Group listening={false}>
      {deathsUntil(events, index).map((d) => {
        const [cx, cy] = px(d.at);
        return (
          <Group key={`morte-${d.playerId}`} x={cx} y={cy} opacity={0.75}>
            <Line points={[-x, -x, x, x]} stroke={color(d.playerId)} strokeWidth={2.5 / zoom} />
            <Line points={[-x, x, x, -x]} stroke={color(d.playerId)} strokeWidth={2.5 / zoom} />
          </Group>
        );
      })}

      {current && isKill(current) && current.killerAt && current.victimAt ? (
        <Line
          points={[...px(current.killerAt), ...px(current.victimAt)]}
          stroke={tokens.bone}
          strokeWidth={2 / zoom}
          dash={[6 / zoom, 4 / zoom]}
        />
      ) : null}

      {(() => {
        const spike = spikeAt(events, index);
        if (!spike) return null;
        const [sx, sy] = px(spike);
        const r = 8 / zoom;
        return <Line points={[sx, sy - r, sx + r, sy, sx, sy + r, sx - r, sy]} closed fill={tokens.gold} stroke={tokens.ink900} strokeWidth={1.5 / zoom} />;
      })()}

      {snapshotAt(events, index).map((pos) => {
        const player = players.find((p) => p.player.id === pos.playerId);
        return <PlayerDot key={pos.playerId} ctx={ctx} at={px(pos)} color={color(pos.playerId)} agentName={player?.agent.name} highlight={current != null && isKill(current) && current.killerId === pos.playerId} />;
      })}
    </Group>
  );
}

function PlayerDot({ ctx, at, color, agentName, highlight }: { ctx: MapContext; at: readonly [number, number]; color: string; agentName?: string; highlight: boolean }) {
  const agent = AGENTS.find((a) => a.name.toLowerCase() === agentName?.toLowerCase());
  const image = useImage(agent ? assetUrl(agent.icon) : undefined);
  const r = 12 / ctx.zoom;
  const inset = 2 / ctx.zoom;
  return (
    <Group x={at[0]} y={at[1]} rotation={ctx.upright}>
      {highlight ? <Circle radius={r + 5 / ctx.zoom} stroke={ctx.tokens.bone} strokeWidth={2 / ctx.zoom} /> : null}
      <Rect x={-r} y={-r} width={r * 2} height={r * 2} fill={color} />
      <Rect x={-r + inset} y={-r + inset} width={(r - inset) * 2} height={(r - inset) * 2} fill={ctx.tokens.ink900} />
      {image ? <KImage image={image} x={-r + inset} y={-r + inset} width={(r - inset) * 2} height={(r - inset) * 2} /> : null}
    </Group>
  );
}
