import { BookOpen, Braces, ClipboardCheck, Home, LibraryBig, Network, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useContent } from "../hooks/useContent";
import { platformLabel } from "../infrastructure/version";
import { useLearningSession } from "./LearningSession";
import { LearningCompanion } from "./LearningCompanion";
import { LanguageSwitcher, useLocale, uiText } from "../i18n";

const navItems = [
  { to: "/", zh: "工作台", en: "Home", icon: Home },
  { to: "/learn", zh: "学习模式", en: "Learn", icon: BookOpen },
  { to: "/exam", zh: "考核模式", en: "Assessment", icon: ClipboardCheck },
  { to: "/terms", zh: "词条库", en: "Terms", icon: Network },
  { to: "/developer", zh: "内容管理", en: "Content", icon: Braces }
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate(); const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { questions } = useContent();
  const { session } = useLearningSession();
  const { locale } = useLocale();
  const localizedNavItems = navItems.filter(item => item.to !== "/developer" || session?.user.role === "developer").map((item) => ({ ...item, label: uiText(locale, item.zh, item.en) }));
  return (
    <div className={`app-frame ${collapsed ? "nav-collapsed" : ""}`}>
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label={uiText(locale, "CeptLens 首页", "CeptLens home")}>
          <span className="brand-mark"><span /></span>
          <span className="brand-copy"><strong>CeptLens</strong><small>{uiText(locale, "AI 模型工程赋能平台", "AI model engineering platform")}</small></span>
        </NavLink>
        <div className="topbar-context">
          <span className="release-pill">{platformLabel}</span>
          <span className="topbar-divider" />
          <span className="topbar-scope">{uiText(locale, "AI 模型工程学习", "AI model engineering")}</span>
        </div>
        <div className="topbar-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="topbar-user profile-trigger"
            onClick={() => navigate(session?.authenticated ? "/account" : `/sign-in?next=${encodeURIComponent(location.pathname+location.search)}`)}
            aria-label={session?.authenticated ? uiText(locale, "设置个人资料", "Edit profile") : uiText(locale, "登录账户", "Sign in")}
            title={session?.authenticated ? session.user.name : uiText(locale, "登录账户", "Sign in")}
          >
            <span className="avatar" aria-hidden="true">{session?.authenticated ? session.user.name.slice(0, 1) : <UserRound size={17} />}</span>
            <span className="topbar-user-name">{session?.authenticated ? session.user.name : uiText(locale, "登录", "Sign in")}</span>
          </button>
        </div>
      </header>
      <aside className="sidebar">
        <nav aria-label={uiText(locale, "主导航", "Main navigation")}>
          {localizedNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} title={label}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="corpus-status"><LibraryBig size={16} /><span><b>{questions.length}</b> {uiText(locale, "道题目", "questions")}</span></div>
          <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? uiText(locale, "展开导航", "Expand navigation") : uiText(locale, "收起导航", "Collapse navigation")}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}<span>{collapsed ? uiText(locale, "展开", "Expand") : uiText(locale, "收起", "Collapse")}</span>
          </button>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label={uiText(locale, "移动端主导航", "Mobile navigation")}>{localizedNavItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <main className="main-content">{children}</main>
      <LearningCompanion />
    </div>
  );
}
