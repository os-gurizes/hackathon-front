import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { q, type Role } from "../../api";
import { Button, Icon, Select } from "../../design/primitives";
import { validarConta, type ContaValues } from "./conta";
import styles from "./ContasPage.module.css";

export type { ContaValues };


type Props = {
  mode: "criar" | "editar";
  initial: ContaValues;
  teams: Array<{ id: number; name: string }>;
  sending: boolean;
  error: string | null;
  onSubmit: (values: ContaValues) => void;
};

const ROLES: Array<{ value: Role; label: string }> = [
  { value: "coach", label: "Coach" },
  { value: "player", label: "Player" },
  { value: "admin", label: "Admin" },
];

/** Formulário de conta, para criar e para editar: papel, vínculo com time e jogador, senha. */
export function ContaForm({ mode, initial, teams, sending, error, onSubmit }: Props) {
  const [v, setV] = useState<ContaValues>(initial);
  const [local, setLocal] = useState<string | null>(null);
  const set = (patch: Partial<ContaValues>) => setV((cur) => ({ ...cur, ...patch }));

  // Jogadores do elenco do time escolhido, em todos os campeonatos
  const team = useQuery({ ...q.teams.get(v.teamId ?? 0), enabled: v.teamId != null && v.role !== "admin" });
  const roster = [...new Map((team.data?.rosters ?? []).flatMap((r) => r.players).map((p) => [p.player.id, p])).values()].sort(
    (a, b) => b.matches - a.matches,
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = validarConta(v, mode);
    setLocal(problem);
    if (!problem) onSubmit(v.role === "admin" ? { ...v, teamId: null, playerId: null } : v);
  };

  const id = (k: string) => `${mode}-${k}`;
  const message = local ?? error;

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {mode === "criar" ? (
        <div className={styles.field}>
          <label htmlFor={id("email")}>E-mail</label>
          <input id={id("email")} type="email" autoComplete="off" value={v.email} onChange={(e) => set({ email: e.target.value.trim() })} placeholder="coach.time@vstats.local" />
        </div>
      ) : null}
      <div className={styles.field}>
        <label htmlFor={id("senha")}>{mode === "criar" ? "Senha" : "Nova senha (opcional)"}</label>
        <input id={id("senha")} type="password" autoComplete="new-password" value={v.password} onChange={(e) => set({ password: e.target.value })} placeholder="Pelo menos 8 caracteres" />
      </div>
      <Select
        label="Papel"
        value={v.role}
        options={ROLES}
        onChange={(role) => set({ role: role as Role, playerId: role === "player" ? v.playerId : null })}
      />
      {v.role !== "admin" ? (
        <Select
          label="Time"
          value={v.teamId ? String(v.teamId) : ""}
          options={[{ value: "", label: "Escolha o time" }, ...teams.map((t) => ({ value: String(t.id), label: t.name }))]}
          onChange={(t) => set({ teamId: t ? Number(t) : null, playerId: null })}
        />
      ) : (
        <p className={styles.help}>Admin não pertence a time: escolhe qual analisar no topo da tela.</p>
      )}
      {v.role === "player" && v.teamId != null ? (
        <Select
          label="Jogador"
          value={v.playerId ? String(v.playerId) : ""}
          disabled={team.isPending}
          options={[
            { value: "", label: team.isPending ? "Carregando elenco" : "Escolha no elenco" },
            ...roster.map((p) => ({ value: String(p.player.id), label: `${p.player.gameName}#${p.player.tagLine} (${p.matches} partidas)` })),
          ]}
          onChange={(p) => set({ playerId: p ? Number(p) : null })}
        />
      ) : null}
      {message ? (
        <p className={styles.error} role="alert">
          <Icon name="alert" size={16} />
          {message}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={sending}>
        {sending ? "Salvando" : mode === "criar" ? "Criar conta" : "Salvar alterações"}
      </Button>
    </form>
  );
}
