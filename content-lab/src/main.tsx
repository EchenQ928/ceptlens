import "katex/dist/katex.min.css";
import '@fontsource-variable/noto-sans-sc';
import './styles/platform/tokens.css';
import './styles/platform/global.css';
import './styles/platform/components.css';
import './styles/platform/responsive.css';
import './styles/platform/learning.css';
import './styles/platform/accounts.css';
import './styles/platform/lens.css';
import './styles/platform/aura.css';
import './styles/platform/aura-dark.css';
import './styles/platform/study-catalog.css';
import './styles/platform/spectral.css';
import './styles/platform/liquid.css';
import './styles/platform/developer.css';
import './styles/lab.css';
import { showStartupFailure } from "./startup-recovery";

// Keep the recovery UI outside the content module graph: malformed packages can
// fail during module evaluation, before a React ErrorBoundary can be mounted.
void import("./render-lab").then(module => module.renderLab()).catch(showStartupFailure);
