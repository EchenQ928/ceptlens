import { BookOpen, Braces, ClipboardCheck, Home, LibraryBig, Network, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useContent } from "../hooks/useContent";
import { platformLabel } from "../infrastructure/version";
import { useLearningSession } from "./LearningSession";
import { LearningCompanion } from "./LearningCompanion";

const navItems = [
  { to: "/", label: "工作台", icon: Home },
  { to: "/learn", label: "学习模式", icon: BookOpen },
  { to: "/exam", label: "考核模式", icon: ClipboardCheck },
  { to: "/terms", label: "词条库", icon: Network },
  { to: "/developer", label: "内容管理", icon: Braces }
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { questions } = useContent();
  const { session } = useLearningSession();
  return (
    <div className={`app-frame ${collapsed ? "nav-collapsed" : ""}`}>
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="CeptLens 首页">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy"><strong>CeptLens</strong><small>AI 模型工程赋能平台</small></span>
        </NavLink>
        <div className="topbar-context">
          <span className="release-pill">{platformLabel}</span>
          <span className="topbar-divider" />
          <span className="topbar-scope">AI 模型工程学习</span>
        </div>
        <button className="topbar-user profile-trigger" onClick={() => window.dispatchEvent(new Event("ceptlens-profile"))} aria-label="设置讨论显示名"><span className="avatar">{session?.user.name.slice(0, 1) || "我"}</span><span>{session?.user.name ?? "讨论身份"}</span></button>
      </header>
      <aside className="sidebar">
        <nav aria-label="主导航">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} title={label}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="corpus-status"><LibraryBig size={16} /><span><b>{questions.length}</b> 道题目</span></div>
          <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "展开导航" : "收起导航"}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}<span>{collapsed ? "展开" : "收起"}</span>
          </button>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="移动端主导航">{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <main className="main-content">{children}</main>
      <LearningCompanion />
    </div>
  );
}
