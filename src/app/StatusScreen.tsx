import { Button, SectionLabel } from "../design/primitives";
import styles from "./StatusScreen.module.css";

/** Tela cheia para os estados antes do app: abrindo a sessão ou servidor fora do ar. */
export function StatusScreen({ title, detail, action }: { title: string; detail?: string; action?: () => void }) {
  return (
    <div className={styles.screen} role={action ? "alert" : "status"}>
      <div className={styles.box}>
        <SectionLabel as="div">Sala Tática</SectionLabel>
        <h1 className={styles.title}>{title}</h1>
        {detail ? <p className={styles.detail}>{detail}</p> : null}
        {action ? (
          <Button variant="primary" onClick={action}>
            Tentar de novo
          </Button>
        ) : null}
      </div>
    </div>
  );
}
