import { SectionLabel } from "../../../design/primitives";

// Tela do Lucas: Player, Meu desempenho. Protótipo em docs/prototipo/PlayerDesempenho.dc.html.
// Dados: q.players.get, q.players.stats, q.players.matches e q.insights({ scope: "player" }) (ver docs/API-FRONT.md).
// O jogador logado vem de useSession(): session.me.player.
export default function MeuDesempenhoPage() {
  return <SectionLabel index={1}>Meu desempenho</SectionLabel>;
}
