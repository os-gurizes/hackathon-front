import { useMe } from "./session";
import { useTeamOptionsStatus } from "./teamScope";

/** Mensagem das telas de coach quando ainda não há time a mostrar, conforme quem está logado. */
export function SemTime({ className }: { className?: string }) {
  const me = useMe();
  const { loading } = useTeamOptionsStatus(me.role === "admin");
  const text =
    me.role !== "admin"
      ? "Sua conta ainda não está ligada a um time. Peça ao admin para vincular."
      : loading
        ? "Carregando os times."
        : "Escolha um time em Time em análise, no topo da tela.";
  return <p className={className}>{text}</p>;
}
