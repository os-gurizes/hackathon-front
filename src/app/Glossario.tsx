import { useState } from "react";
import { buscarTermos } from "../copy/glossario";
import { Drawer } from "../design/primitives";
import styles from "./Glossario.module.css";

/** Painel lateral com as métricas explicadas em uma frase, acessível de qualquer tela. */
export function Glossario({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busca, setBusca] = useState("");
  const termos = buscarTermos(busca);
  return (
    <Drawer open={open} title="Glossário" onClose={onClose}>
      <label className={styles.search}>
        <span>Buscar termo</span>
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="K/D, trade, eco..." autoFocus />
      </label>
      {termos.length ? (
        <dl className={styles.list}>
          {termos.map((t) => (
            <div key={t.termo} className={styles.item}>
              <dt>
                <strong>{t.termo}</strong>
                {t.nome !== t.termo ? <span className={styles.nome}>{t.nome}</span> : null}
              </dt>
              <dd>{t.explicacao}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.empty}>Nenhum termo com "{busca}". Tente outra palavra.</p>
      )}
    </Drawer>
  );
}
