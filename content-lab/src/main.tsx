import "katex/dist/katex.min.css";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/lab.css";
import { showStartupFailure } from "./startup-recovery";

// Keep the recovery UI outside the content module graph: malformed packages can
// fail during module evaluation, before a React ErrorBoundary can be mounted.
void import("./render-lab").then(module => module.renderLab()).catch(showStartupFailure);
