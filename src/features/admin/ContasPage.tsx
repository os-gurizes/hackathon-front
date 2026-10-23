import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, q, type AdminUser, type Role } from "../../api";
import { cx } from "../../design/cx";
import { Badge, Button, Drawer, SectionLabel, Select, Table, type BadgeTone } from "../../design/primitives";
import { ContaForm, type ContaValues } from "./ContaForm";
import styles from "./ContasPage.module.css";

const ROLE_LABEL: Record<Role, string> = { coach: "Coach", player: "Player", admin: "Admin" };
const ROLE_TONE: Record<Role, BadgeTone> = { coach: "defense", player: "neutral", admin: "gold" };

const empty: ContaValues = { email: "", password: "", role: "coach", teamId: null, playerId: null };

/** Nome do jogador vinculado, buscado pelo id (cada linha usa o cache das outras). */
function PlayerName({ id }: { id: number }) {
  const player = useQuery(q.players.get(id));
  if (player.isPending) return <span className={styles.muted}>carregando</span>;
  if (!player.data) return <span className={styles.muted}>jogador {id}</span>;
  return (
    <span>
      {player.data.player.gameName}
      <span className={styles.muted}>#{player.data.player.tagLine}</span>
    </span>
  );
}

export default function ContasPage() {
  const client = useQueryClient();
  const users = useQuery(q.admin.users());
  const teamsQuery = useQuery(q.teams.list());
  const teams = useMemo(
    () => (teamsQuery.data ?? []).map((t) => ({ id: t.team.id, name: t.team.displayName })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [teamsQuery.data],
  );
  const teamName = (id: number | null) => (id == null ? null : (teams.find((t) => t.id === id)?.name ?? `Time ${id}`));

  const [busca, setBusca] = useState("");
  const [papel, setPapel] = useState<Role | "">("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [createKey, setCreateKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = () => client.invalidateQueries({ queryKey: q.admin.users().queryKey });
  const create = useMutation({
    mutationFn: (v: ContaValues) =>
      adminService.create({ email: v.email, password: v.password, role: v.role, ...(v.teamId ? { teamId: v.teamId } : {}), ...(v.playerId ? { playerId: v.playerId } : {}) }),
    onSuccess: (u) => {
      setNotice(`Conta ${u.email} criada.`);
      setCreateKey((k) => k + 1);
      void refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({ id, v }: { id: number; v: ContaValues }) =>
      adminService.update(id, { role: v.role, teamId: v.teamId, playerId: v.playerId, ...(v.password ? { password: v.password } : {}) }),
    onSuccess: (u) => {
      setNotice(`Conta ${u.email} atualizada.`);
      setEditing(null);
      void refresh();
    },
  });

  const all = users.data ?? [];
  const rows = all
    .filter((u) => (papel ? u.role === papel : true))
    .filter((u) => u.email.toLowerCase().includes(busca.trim().toLowerCase()) || (teamName(u.teamId) ?? "").toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => a.email.localeCompare(b.email));
  const count = (r: Role) => all.filter((u) => u.role === r).length;
  const semVinculo = all.filter((u) => (u.role === "coach" && u.teamId == null) || (u.role === "player" && (u.teamId == null || u.playerId == null))).length;

  if (users.error) return <p className={styles.state}>{users.error.message}</p>;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <SectionLabel index={1}>Contas</SectionLabel>
        <p className={styles.insight}>
          {users.isPending
            ? "Carregando contas."
            : `${all.length} contas: ${count("coach")} coaches, ${count("player")} players e ${count("admin")} admin. ${
                semVinculo ? `${semVinculo} sem vínculo completo com time ou jogador.` : "Todas com vínculo completo."
              }`}
        </p>
        <div role="status" aria-live="polite" className={cx(styles.notice, notice && styles.noticeOn)}>
          {notice}
        </div>
      </div>

      <section className={cx(styles.panel, styles.create, "st-cut")} aria-labelledby="nova-conta">
        <SectionLabel index={2} as="div">
          <span id="nova-conta">Nova conta</span>
        </SectionLabel>
        <ContaForm
          key={createKey}
          mode="criar"
          initial={empty}
          teams={teams}
          sending={create.isPending}
          error={create.error?.message ?? null}
          onSubmit={(v) => {
            setNotice(null);
            create.mutate(v);
          }}
        />
      </section>

      <section className={cx(styles.panel, styles.list, "st-cut")} aria-labelledby="todas-contas">
        <SectionLabel index={3} as="div">
          <span id="todas-contas">Todas as contas</span>
        </SectionLabel>
        <div className={styles.filters}>
          <div className={styles.field}>
            <label htmlFor="busca-contas">Buscar</label>
            <input id="busca-contas" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="E-mail ou time" />
          </div>
          <Select
            label="Papel"
            value={papel}
            options={[{ value: "", label: "Todos" }, { value: "coach", label: "Coach" }, { value: "player", label: "Player" }, { value: "admin", label: "Admin" }]}
            onChange={(v) => setPapel(v as Role | "")}
          />
        </div>
        {rows.length ? (
          <div className={styles.tableWrap}>
            <Table
              caption={`${rows.length} de ${all.length} contas.`}
              columns={[
                { key: "email", label: "E-mail" },
                { key: "role", label: "Papel", render: (u: AdminUser) => <Badge tone={ROLE_TONE[u.role]} icon={null}>{ROLE_LABEL[u.role]}</Badge> },
                {
                  key: "team",
                  label: "Time",
                  render: (u: AdminUser) => teamName(u.teamId) ?? <span className={styles.muted}>{u.role === "admin" ? "todos" : "sem time"}</span>,
                },
                {
                  key: "player",
                  label: "Jogador",
                  render: (u: AdminUser) => (u.playerId ? <PlayerName id={u.playerId} /> : <span className={styles.muted}>{u.role === "player" ? "sem jogador" : "não se aplica"}</span>),
                },
                {
                  key: "acoes",
                  label: <span className="st-visually-hidden">Ações</span>,
                  render: (u: AdminUser) => (
                    <Button variant="ghost" size="sm" icon="pencil" aria-label={`Editar ${u.email}`} onClick={() => setEditing(u)}>
                      Editar
                    </Button>
                  ),
                },
              ]}
              rows={rows}
            />
          </div>
        ) : (
          <p className={styles.help}>{users.isPending ? "Carregando." : "Nenhuma conta com esse filtro."}</p>
        )}
      </section>

      <Drawer open={editing != null} title={editing ? `Editar ${editing.email}` : ""} onClose={() => setEditing(null)}>
        {editing ? (
          <ContaForm
            key={editing.id}
            mode="editar"
            initial={{ email: editing.email, password: "", role: editing.role, teamId: editing.teamId, playerId: editing.playerId }}
            teams={teams}
            sending={update.isPending}
            error={update.error?.message ?? null}
            onSubmit={(v) => update.mutate({ id: editing.id, v })}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
