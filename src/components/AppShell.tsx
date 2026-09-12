import { UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useLearningSession } from "./LearningSession";
import { LearningCompanion } from "./LearningCompanion";
import { LanguageSwitcher, useLocale, uiText } from "../i18n";
import { Brand } from "./Brand";
import { ProductIcon, type ProductIconKind } from "./ProductIcon";
import { SpectralBackdrop } from "./spectral/SpectralBackdrop";
import { useVisualEnvironment } from "./spectral/VisualEnvironment";

const navItems: { to: string; zh: string; en: string; kind: ProductIconKind }[] = [
  { to: "/learn", zh: "学习", en: "Learn", kind: "learn" },
  { to: "/exam", zh: "考核", en: "Assess", kind: "assess" },
  { to: "/terms", zh: "词条", en: "Concepts", kind: "concepts" },
  { to: "/developer", zh: "内容", en: "Content", kind: "content" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useLearningSession();
  const { locale } = useLocale();
  const { paused, focused } = useVisualEnvironment();
  const preset = location.pathname.startsWith("/terms") ? "concepts" : location.pathname.startsWith("/exam") ? "assess" : location.pathname.startsWith("/learn") ? "learn" : "account";
  return <div className={`app-frame ${location.pathname === "/" ? "aura-landing" : "aura-workspace"}`}>
    {location.pathname !== "/" && <SpectralBackdrop preset={preset} paused={paused || focused}/>}
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}>{uiText(locale, "跳到主要内容", "Skip to content")}</a>
    <header className="topbar">
      <NavLink to="/" className="brand" aria-label={uiText(locale, "CeptLens 首页", "CeptLens home")}><Brand /></NavLink>
      <nav className="top-navigation" aria-label={uiText(locale, "主导航", "Main navigation")}>
        {navItems.filter(item => item.to !== "/developer" || session?.user.role === "developer").map(({ to, zh, en, kind }) => <NavLink key={to} to={to}>
          {({ isActive }) => <>{isActive && <motion.span className="nav-selection" layoutId="nav-selection" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}<ProductIcon kind={kind}/><span>{uiText(locale, zh, en)}</span></>}
        </NavLink>)}
      </nav>
      <div className="topbar-actions">
        <LanguageSwitcher />
        <button type="button" className="topbar-user profile-trigger" onClick={() => navigate(session?.authenticated ? "/account" : `/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`)} aria-label={session?.authenticated ? uiText(locale, "设置个人资料", "Edit profile") : uiText(locale, "登录账户", "Sign in")} title={session?.authenticated ? session.user.name : uiText(locale, "登录", "Sign in")}>
          <span className="avatar" aria-hidden="true">{session?.authenticated ? session.user.name.slice(0, 1) : <UserRound size={19}/>}</span>
        </button>
      </div>
    </header>
    <main className="main-content" id="main-content" tabIndex={-1}>{children}</main>
    {location.pathname !== "/" && <LearningCompanion />}
  </div>;
}
