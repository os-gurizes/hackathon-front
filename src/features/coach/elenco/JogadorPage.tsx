import { useQuery } from "@tanstack/react-query";
import { q } from "../../../api";
import { linkHandler } from "../../../app/router";
import { Badge, Icon } from "../../../design/primitives";
import { DesempenhoView } from "../../player/desempenho/MeuDesempenhoPage";
import styles from "./JogadorPage.module.css";

// Visão de player de um jogador do elenco, aberta pelo coach em modo leitura: /coach/jogador?id=101.
// A tela é a mesma que o jogador vê em Meu desempenho, sem os links para as abas dele.

export default function JogadorPage() {
  const raw = new URLSearchParams(window.location.search).get("id");
  const id = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  const profile = useQuery({ ...q.players.get(id ?? 0), enabled: id != null });

  const back = (
    <a href="/coach/elenco" onClick={linkHandler("/coach/elenco")} className={styles.back}>
      <Icon name="arrow" size={16} className={styles.backIcon} />
      Voltar ao elenco
    </a>
  );

  if (id == null) {
    return (
      <div className={styles.page}>
        {back}
        <p className={styles.state}>Jogador não informado. Abra pelo Elenco.</p>
      </div>
    );
  }
  if (profile.error) {
    return (
      <div className={styles.page}>
        {back}
        <p className={styles.state}>{profile.error.message}</p>
      </div>
    );
  }

  const p = profile.data?.player;
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        {back}
        <div className={styles.title}>
          <h1 className={styles.name}>
            {p ? (
              <>
                {p.gameName}
                <span className={styles.tag}>#{p.tagLine}</span>
              </>
            ) : (
              "Carregando jogador"
            )}
          </h1>
          <Badge tone="estimate" icon="eye">
            Modo leitura
          </Badge>
        </div>
        <p className={styles.note}>Esta é a tela que o jogador vê em Meu desempenho. Os textos falam diretamente com ele.</p>
      </div>
      <DesempenhoView playerId={id} readOnly />
    </div>
  );
}
