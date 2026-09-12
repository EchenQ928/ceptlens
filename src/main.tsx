import React from "react";
import ReactDOM from "react-dom/client";
import "katex/dist/katex.min.css";
import "@fontsource-variable/noto-sans-sc";
import { MotionConfig } from "motion/react";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/responsive.css";
import "./styles/learning.css";
import "./styles/accounts.css";
import "./styles/lens.css";
import "./styles/aura.css";
import "./styles/aura-dark.css";
import "./styles/study-catalog.css";
import "./styles/spectral.css";
import "./styles/liquid.css";
import "./styles/developer.css";
import { App } from "./app/App";
import { LocaleProvider } from "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user"><LocaleProvider><App /></LocaleProvider></MotionConfig>
  </React.StrictMode>
);
