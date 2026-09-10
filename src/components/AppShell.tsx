import {
  BookOpen,
  CheckSquare,
  Code2,
  GitBranch,
  Languages,
  LayoutDashboard,
  Menu,
  Network,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { useLocale, useCopy, type CopyKey } from "../i18n";

const navItems: Array<{ to: string; label: CopyKey; icon: LucideIcon }> = [
  { to: "/", label: "navOverview", icon: LayoutDashboard },
  { to: "/learn", label: "navLearn", icon: BookOpen },
  { to: "/terms", label: "navTerms", icon: Network },
  { to: "/assessment", label: "navAssess", icon: CheckSquare },
  { to: "/developers", label: "navDevelopers", icon: Code2 }
];

export function AppShell() {
  const { locale, setLocale } = useLocale();
  const copy = useCopy();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageName =
    location.pathname === "/"
      ? copy("navOverview")
      : location.pathname.startsWith("/terms")
        ? copy("navTerms")
        : location.pathname.startsWith("/assessment")
          ? copy("navAssess")
          : location.pathname.startsWith("/developers")
            ? copy("navDevelopers")
            : copy("navLearn");

  return (
    <div className="app-shell">
      <button
        className={`mobile-backdrop ${mobileOpen ? "is-visible" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-label={copy("closeMenu")}
      />
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            CL
          </div>
          <div>
            <strong>{copy("appName")}</strong>
            <span>{copy("tagline")}</span>
          </div>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{copy(label)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-dot" />
            <span>Local-first workspace</span>
          </div>
          <span className="sidebar-version">v1.0.0</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? copy("closeMenu") : copy("openMenu")}
              title={mobileOpen ? copy("closeMenu") : copy("openMenu")}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <span className="topbar-kicker">CEPTLENS / {pageName}</span>
          </div>
          <div className="topbar-actions">
            <button
              className="locale-switch"
              onClick={() => setLocale(locale === "en" ? "zh" : "en")}
              aria-label={`${copy("languageLabel")}: ${locale === "en" ? copy("switchToChinese") : copy("switchToEnglish")}`}
              title={copy("languageLabel")}
            >
              <Languages size={16} />
              <span>{locale === "en" ? copy("switchToChinese") : copy("switchToEnglish")}</span>
            </button>
            <a
              className="github-link"
              href="https://github.com/EchenQ928/ceptlens"
              target="_blank"
              rel="noreferrer"
              title="Open CeptLens on GitHub"
            >
              <GitBranch size={16} />
              <span>GitHub</span>
            </a>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
