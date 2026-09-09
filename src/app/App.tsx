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

export function App() {
  return <HashRouter><LearningSession><AppRoutes /></LearningSession></HashRouter>;
}

function AppRoutes() {
  const location = useLocation();
  return <AppShell><ErrorBoundary key={location.pathname}><Routes><Route path="/" element={<DashboardPage />} /><Route path="/learn" element={<LearnCatalogPage />} /><Route path="/learn/questions/:questionId" element={<StudyPage />} /><Route path="/exam" element={<ExamPage />} /><Route path="/terms" element={<TermLibraryPage />} /><Route path="/terms/:termId" element={<TermPage />} /><Route path="/developer" element={<DeveloperPage />} /><Route path="*" element={<div className="empty-state"><h2>页面不存在</h2><Link to="/">返回首页</Link></div>} /></Routes></ErrorBoundary></AppShell>;
}
