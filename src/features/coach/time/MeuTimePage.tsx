import { SectionLabel } from "../../../design/primitives";

// Tela do Lucas: Coach, Meu time. Protótipo em docs/prototipo/CoachTime.dc.html.
// Dados: q.teams.get, q.teams.economy, q.insights({ scope: "team" }) e q.maps.stats (ver docs/API-FRONT.md).
// O time do coach vem de useSession(): session.me.team.
export default function MeuTimePage() {
  return <SectionLabel index={1}>Meu time</SectionLabel>;
}
