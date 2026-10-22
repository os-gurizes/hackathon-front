import { useMemo } from "react";
import Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import type { KonvaNodeEvents } from "react-konva";
import type { GroupConfig } from "konva/lib/Group";

type Props = Omit<GroupConfig, "x" | "y"> &
  KonvaNodeEvents & {
    x: number;
    y: number;
    text: string;
    fontSize: number;
    color: string;
    background: string;
    stroke?: string;
  };

/** Rótulo em caixa alta com fundo, centralizado no ponto (x, y). */
export function TagLabel({ text, fontSize, color, background, stroke, ...group }: Props) {
  const upper = text.toUpperCase();
  const pad = fontSize * 0.35;
  const spacing = fontSize * 0.06;
  const { width, height } = useMemo(() => {
    const t = new Konva.Text({ text: upper, fontFamily: "Barlow Condensed", fontStyle: "600", fontSize, letterSpacing: spacing });
    const size = { width: t.width(), height: t.height() };
    t.destroy();
    return size;
  }, [upper, fontSize, spacing]);
  const w = width + pad * 2;
  const h = height + pad * 2;
  return (
    <Group {...group}>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill={background} stroke={stroke} strokeWidth={stroke ? fontSize * 0.12 : 0} />
      <Text
        x={-w / 2 + pad}
        y={-h / 2 + pad}
        text={upper}
        fontFamily="Barlow Condensed"
        fontStyle="600"
        fontSize={fontSize}
        letterSpacing={spacing}
        fill={color}
      />
    </Group>
  );
}
