import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const PB_URL = (import.meta.env.VITE_PB_URL as string | undefined) || "/admin";

export function Layout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <a href="#main" className="skip-link">Skip to main content</a>
      <header className="app-header sticky top-0 z-30 backdrop-blur-md bg-paper/80 border-b border-ink-line">
        <div className="container-wide flex items-center justify-between h-14 gap-6">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-ink"
            aria-label="Pratidhwani — home"
          >
            <Logo size={28} />
            <span className="font-display text-[1.05rem] tracking-tight font-medium">
              Pratidhwani
            </span>
            <span className="hidden md:inline text-ink-mute text-xs font-mono uppercase tracking-widest">
              v0.1
            </span>
          </NavLink>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1 text-sm">
              <NavItem to="/" label="Dashboard" />
              <NavItem to="/sim" label="Simulator" />
              <NavItem to="/pitch" label="Pitch" />
              <NavItem to="/report" label="Report" />
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              className="btn hidden sm:inline-flex"
              href={PB_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              Admin
              <span aria-hidden="true">↗</span>
            </a>
            <ThemeToggle />
          </div>
        </div>

        <nav aria-label="Primary mobile" className="md:hidden border-t border-ink-line">
          <ul className="container-wide flex items-center gap-1 overflow-x-auto py-2 text-sm scrollbar-quiet">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/sim" label="Simulator" />
            <NavItem to="/pitch" label="Pitch" />
            <NavItem to="/report" label="Report" />
          </ul>
        </nav>
      </header>

      <main id="main" className="flex-1 focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="app-footer border-t border-ink-line mt-12">
        <div className="container-wide py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-ink-mute">
          <p>
            <span className="font-medium text-ink-soft">Pratidhwani</span>
            <span className="divider-dot" />
            B.Tech CSE Cloud Computing capstone
            <span className="divider-dot" />
            Anshuman Mohanty (GF202217744)
          </p>
          <p className="font-mono">
            <span aria-hidden="true">↳</span> deployed on Cloud Run · asia-south1
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === "/"}
        className={({ isActive }) =>
          [
            "px-3 py-1.5 rounded-md transition-colors",
            isActive
              ? "bg-paper-sunk text-ink border border-ink-line"
              : "text-ink-soft hover:text-ink hover:bg-paper-sunk/60 border border-transparent",
          ].join(" ")
        }
      >
        {label}
      </NavLink>
    </li>
  );
}
