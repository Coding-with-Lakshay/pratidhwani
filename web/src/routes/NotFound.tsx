import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="container-wide py-24 text-center">
      <p className="label-eyebrow">404</p>
      <h1 className="font-display text-display-lg mt-2">No echo here.</h1>
      <p className="mt-3 text-ink-mute max-w-md mx-auto">
        That route is not part of Pratidhwani. Try the dashboard, simulator, pitch deck, or report.
      </p>
      <Link to="/" className="btn btn-primary mt-6 inline-flex">Go home</Link>
    </div>
  );
}
