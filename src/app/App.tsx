import { lazy, Suspense } from "react";
import { AppShell } from "./AppShell";
import { usePath } from "./router";
import { ReferencePage } from "../features/reference/ReferencePage";

const PranchetaPage = lazy(() => import("../features/coach/prancheta/PranchetaPage"));

export function App() {
  const path = usePath();

  if (path === "/referencia") return <ReferencePage />;

  return (
    <AppShell active="prancheta" wide>
      <Suspense fallback={null}>
        <PranchetaPage />
      </Suspense>
    </AppShell>
  );
}
