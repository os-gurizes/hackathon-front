import { clock } from "./replay";
import styles from "./PartidaPage.module.css";

type Point = { tMs: number; p: number; event: string };

const W = 360;
const H = 120;
const PAD = 8;

/** Chance de vitória do time ao longo do round, com o momento do replay marcado. */
export function WinProbChart({ points, nowMs, teamName }: { points: Point[]; nowMs: number | null; teamName: string }) {
  if (points.length < 2) return <p className={styles.help}>Sem curva de chance para este round.</p>;
  const end = Math.max(...points.map((p) => p.tMs), 1);
  const X = (t: number) => PAD + (t / end) * (W - PAD * 2);
  const Y = (p: number) => PAD + (1 - p) * (H - PAD * 2);
  // Degraus: a chance muda no evento e fica parada até o próximo
  const path = points.map((pt, i) => (i ? `H${X(pt.tMs).toFixed(1)}V${Y(pt.p).toFixed(1)}` : `M${X(pt.tMs).toFixed(1)} ${Y(pt.p).toFixed(1)}`)).join("");
  const last = points.at(-1)!;
  return (
    <figure className={styles.chart}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Chance de vitória de ${teamName}: começa em ${Math.round(points[0]!.p * 100)}% e termina em ${Math.round(last.p * 100)}%.`}
        className={styles.svg}
      >
        <line x1={PAD} x2={W - PAD} y1={Y(0.5)} y2={Y(0.5)} className={styles.mid} />
        <path d={path} className={styles.curve} />
        {nowMs != null ? <line x1={X(nowMs)} x2={X(nowMs)} y1={PAD} y2={H - PAD} className={styles.now} /> : null}
      </svg>
      <figcaption className={styles.help}>
        Chance de vitória de {teamName}: {Math.round(points[0]!.p * 100)}% no início, {Math.round(last.p * 100)}% no fim ({clock(last.tMs)}). A linha do meio é 50%.
      </figcaption>
    </figure>
  );
}
