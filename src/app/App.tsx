import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AssessmentPage } from "../pages/AssessmentPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DeveloperPage } from "../pages/DeveloperPage";
import { LearnPage } from "../pages/LearnPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { QuestionPage } from "../pages/QuestionPage";
import { TermPage } from "../pages/TermPage";
import { TermsPage } from "../pages/TermsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:questionId" element={<QuestionPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/terms/:termId" element={<TermPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/developers" element={<DeveloperPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
