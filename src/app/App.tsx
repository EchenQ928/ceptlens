import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AppShell } from "../components/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { DeveloperPage } from "../pages/DeveloperPage";
import { ExamPage } from "../pages/ExamPage";
import { LearnCatalogPage } from "../pages/LearnCatalogPage";
import { StudyPage } from "../pages/StudyPage";
import { TermLibraryPage, TermPage } from "../pages/TermPages";
import { LearningSession } from "../components/LearningSession";
import { uiText, useLocale } from "../i18n";

export function App() {
  return <HashRouter><LearningSession><AppRoutes /></LearningSession></HashRouter>;
}

function AppRoutes() {
  const location = useLocation();
  const { locale } = useLocale();
  return <AppShell><ErrorBoundary key={location.pathname}><Routes><Route path="/" element={<DashboardPage />} /><Route path="/learn" element={<LearnCatalogPage />} /><Route path="/learn/questions/:questionId" element={<StudyPage />} /><Route path="/exam" element={<ExamPage />} /><Route path="/terms" element={<TermLibraryPage />} /><Route path="/terms/:termId" element={<TermPage />} /><Route path="/developer" element={<DeveloperPage />} /><Route path="*" element={<div className="empty-state"><h2>{uiText(locale, "页面不存在", "Page not found")}</h2><Link to="/">{uiText(locale, "返回首页", "Back home")}</Link></div>} /></Routes></ErrorBoundary></AppShell>;
}
