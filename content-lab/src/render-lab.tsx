import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { LabPage } from "./pages/LabPage";
import { showStartupFailure } from "./startup-recovery";

export function renderLab() {
  createRoot(document.getElementById("root")!, { onUncaughtError: showStartupFailure })
    .render(<React.StrictMode><HashRouter><LabPage /></HashRouter></React.StrictMode>);
}
