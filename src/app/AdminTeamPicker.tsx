import { Select } from "../design/primitives";
import { setAdminTeam, useTeamOptions, useTeamScope } from "./teamScope";
import styles from "./AppShell.module.css";

/** Só para o admin: escolhe o time que as telas de coach mostram. */
export function AdminTeamPicker() {
  const options = useTeamOptions();
  const team = useTeamScope();
  if (!options.length) return null;
  return (
    <div className={styles.picker}>
      <span className={styles.pickerLabel} id="time-em-analise">
        Time em análise
      </span>
      <Select
        aria-labelledby="time-em-analise"
        value={team ? String(team.id) : ""}
        options={options.map((t) => ({ value: String(t.team.id), label: `${t.team.displayName} (${t.matches})` }))}
        onChange={(v) => setAdminTeam(Number(v))}
      />
    </div>
  );
}
