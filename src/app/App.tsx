import { Suspense, useEffect } from "react";
import { ReferencePage } from "../features/reference/ReferencePage";
import { LoginPage } from "../features/auth/LoginPage";
import { AppShell } from "./AppShell";
import { navigate, usePath } from "./router";
import { ROUTES, tabsFor } from "./routes";
import { homeFor, useAuthActions, useSession } from "./session";
import { StatusScreen } from "./StatusScreen";

/** Troca o endereço sem empilhar histórico (redirecionamentos de guarda). */
function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to]);
  return null;
}

export function App() {
  const path = usePath();
  const session = useSession();
  const { logout } = useAuthActions();

  if (path === "/referencia") return <ReferencePage />;
  if (session.status === "loading") return <StatusScreen title="Abrindo a sala" />;
  if (session.status === "error") {
    return (
      <StatusScreen title="Não foi possível falar com o servidor" detail={session.error.message} action={() => window.location.reload()} />
    );
  }
  if (session.status === "anonymous") return path === "/login" ? <LoginPage /> : <Redirect to="/login" />;

  const { me } = session;
  const route = ROUTES.find((r) => r.path === path);
  // Login, raiz, rota desconhecida ou de outro papel: vai para a tela inicial do papel
  if (!route || !route.roles.includes(me.role)) return <Redirect to={homeFor(me.role)} />;

  const Page = route.page;
  return (
    <AppShell
      me={me}
      tabs={tabsFor(me.role)}
      path={path}
      wide={route.wide}
      onLogout={() => void logout().then(() => navigate("/login", { replace: true }))}
    >
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </AppShell>
  );
}
