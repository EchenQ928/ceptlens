import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { LabPage } from "./pages/LabPage";
import { showStartupFailure } from "./startup-recovery";
import { LocaleProvider } from "./i18n";
import { MotionConfig } from 'motion/react';
import { VisualEnvironment } from './components/spectral/VisualEnvironment';

export function renderLab() {
  createRoot(document.getElementById("root")!, { onUncaughtError: showStartupFailure })
    .render(<React.StrictMode><MotionConfig reducedMotion="user"><LocaleProvider><HashRouter><VisualEnvironment><LabPage /></VisualEnvironment></HashRouter></LocaleProvider></MotionConfig></React.StrictMode>);
}
