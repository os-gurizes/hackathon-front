import { useEffect, useState } from "react";
import type { Role } from "../api";
import { Button, Icon, SectionLabel } from "../design/primitives";
import { marcarTourVisto } from "./tourState";
import styles from "./Tour.module.css";

type Passo = { titulo: string; texto: string };

// Três passos curtos por papel (spec, seção 7): o que cada aba responde, em segunda pessoa
const PASSOS: Record<"coach" | "player", Passo[]> = {
  coach: [
    {
      titulo: "Meu time",
      texto: "O panorama do time: onde vocês ganham e perdem por mapa e lado, e os alertas que mais custam rounds.",
    },
    {
      titulo: "Prancheta",
      texto: "Desenhe a estratégia por fase, com agentes, habilidades e setas. Use o heatmap do time como fundo e compartilhe por link.",
    },
    {
      titulo: "Heatmap",
      texto: "Onde o seu time e os adversários jogam, abatem e morrem em cada mapa. O link guarda os filtros para mandar ao elenco.",
    },
  ],
  player: [
    {
      titulo: "Meu desempenho",
      texto: "Seus números comparados com a sua média e com as últimas partidas, e os pontos que mais pesam agora.",
    },
    {
      titulo: "Meus mapas",
      texto: "Onde você passa mais tempo, abate e morre em cada mapa. A tabela ao lado traz a mesma leitura em texto.",
    },
    {
      titulo: "Glossário",
      texto: "Toda sigla tem explicação. Passe o mouse sobre um termo sublinhado ou abra o Glossário no topo da tela.",
    },
  ],
};

/** Primeiro acesso guiado: 3 passos, pode ser pulado e reaberto pelo botão "Como usar". */
export function Tour({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const passos = PASSOS[role === "player" ? "player" : "coach"];
  const [i, setI] = useState(0);
  const fechar = () => {
    marcarTourVisto(role);
    setI(0);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;
  const passo = passos[i]!;
  const ultimo = i === passos.length - 1;

  return (
    <div className={styles.scrim}>
      <div role="dialog" aria-modal="true" aria-labelledby="tour-titulo" className={`${styles.box} st-cut`}>
        <SectionLabel index={i + 1} as="div">
          Como usar · passo {i + 1} de {passos.length}
        </SectionLabel>
        <h2 id="tour-titulo" className={styles.title}>
          {passo.titulo}
        </h2>
        <p className={styles.text}>{passo.texto}</p>
        <div className={styles.dots} aria-hidden="true">
          {passos.map((_, k) => (
            <span key={k} className={k === i ? styles.dotOn : styles.dot} />
          ))}
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={fechar}>
            Pular
          </Button>
          <div className={styles.nav}>
            {i > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setI(i - 1)}>
                Voltar
              </Button>
            ) : null}
            <Button variant="primary" size="sm" autoFocus onClick={() => (ultimo ? fechar() : setI(i + 1))}>
              {ultimo ? "Entendi" : "Próximo"}
              {ultimo ? null : <Icon name="arrow" size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
