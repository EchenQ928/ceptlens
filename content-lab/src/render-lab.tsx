import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { LabPage } from "./pages/LabPage";
import { showStartupFailure } from "./startup-recovery";
import { LocaleProvider } from "./i18n";

export function renderLab() {
  createRoot(document.getElementById("root")!, { onUncaughtError: showStartupFailure })
    .render(<React.StrictMode><LocaleProvider><HashRouter><LabPage /></HashRouter></LocaleProvider></React.StrictMode>);
}
