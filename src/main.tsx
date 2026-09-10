import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { LocaleProvider } from "./i18n";
import { ProgressProvider } from "./state/progress";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </LocaleProvider>
  </StrictMode>
);
