import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./routes/Dashboard";

const Sim = lazy(() => import("./routes/Sim").then((m) => ({ default: m.Sim })));
const Pitch = lazy(() => import("./routes/Pitch").then((m) => ({ default: m.Pitch })));
const Report = lazy(() => import("./routes/Report").then((m) => ({ default: m.Report })));
const NotFound = lazy(() => import("./routes/NotFound").then((m) => ({ default: m.NotFound })));

function RouteFallback() {
  return (
    <div className="container-wide py-24" aria-busy="true">
      <p className="label-eyebrow animate-pulse-soft">Loading view…</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route
          path="/sim"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Sim />
            </Suspense>
          }
        />
        <Route
          path="/report"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Report />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/pitch"
        element={
          <Suspense fallback={<RouteFallback />}>
            <Pitch />
          </Suspense>
        }
      />
    </Routes>
  );
}
