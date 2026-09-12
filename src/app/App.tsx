import { HashRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useLayoutEffect } from "react";
import { SignInPage } from "../pages/SignInPage";
import { AccountPage } from "../pages/AccountPage";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AppShell } from "../components/AppShell";
import { BrandIcon } from "../components/Brand";
import { DashboardPage } from "../pages/DashboardPage";
import { DeveloperPage } from "../pages/DeveloperPage";
import { ExamPage } from "../pages/ExamPage";
import { LearnCatalogPage } from "../pages/LearnCatalogPage";
import { StudyPage } from "../pages/StudyPage";
import { TermLibraryPage, TermPage } from "../pages/TermPages";
import { LearningSession, useLearningSession } from "../components/LearningSession";
import { uiText, useLocale } from "../i18n";
import { VisualEnvironment } from "../components/spectral/VisualEnvironment";
const SpectralLab = import.meta.env.DEV ? lazy(() => import("../pages/SpectralLab")) : null;

export function App() {
  return <HashRouter><LearningSession><VisualEnvironment><AppRoutes /></VisualEnvironment></LearningSession></HashRouter>;
}

function AppRoutes() {
  const location = useLocation();
  const { locale } = useLocale();
  const { session, error } = useLearningSession();
  useLayoutEffect(()=>{window.scrollTo(0,0);},[location.pathname]);
  if (SpectralLab && location.pathname === "/__spectral") return <Suspense fallback={null}><SpectralLab/></Suspense>;
  if (location.pathname === "/sign-in") return <SignInPage/>;
  if (!session && !error) return <div className="session-loading" role="status"><BrandIcon/><span>CeptLens</span><small>{uiText(locale,"正在打开你的学习空间…","Opening your learning space…")}</small></div>;
  if (location.pathname !== "/" && !session?.authenticated && sessionStorage.getItem("ceptlens.visitor-entry.v1") !== "true") return <Navigate to={`/sign-in?next=${encodeURIComponent(location.pathname+location.search)}`} replace/>;
  return <AppShell><ErrorBoundary key={location.pathname.startsWith("/learn/questions/") ? "/learn/questions" : location.pathname}><Routes><Route path="/" element={<DashboardPage />} /><Route path="/learn" element={<LearnCatalogPage />} /><Route path="/learn/questions/:questionId" element={<StudyPage />} /><Route path="/exam" element={<ExamPage />} /><Route path="/terms" element={<TermLibraryPage />} /><Route path="/terms/:termId" element={<TermPage />} /><Route path="/account" element={<AccountPage />} /><Route path="/developer" element={<DeveloperPage />} /><Route path="*" element={<div className="empty-state"><h2>{uiText(locale, "页面不存在", "Page not found")}</h2><Link to="/">{uiText(locale, "返回首页", "Back home")}</Link></div>} /></Routes></ErrorBoundary></AppShell>;
}
