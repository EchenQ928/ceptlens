import { Check, Copy, FileCode2, GitBranch, Server, Terminal } from "lucide-react";
import { useState } from "react";
import { useCopy } from "../i18n";

const commands = ["npm install", "npm run check", "npm run dev"];

export function DeveloperPage() {
  const copy = useCopy();
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    await navigator.clipboard?.writeText(commands.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <span className="eyebrow">OPEN SOURCE / ENGLISH FIRST</span>
          <h1>{copy("navDevelopers")}</h1>
          <p>{copy("developerDescription")}</p>
        </div>
        <div className="intro-stat">
          <strong>1</strong>
          <span>{copy("sourceOfTruth")}</span>
        </div>
      </section>

      <section className="architecture-grid">
        <article className="architecture-item">
          <FileCode2 size={20} />
          <h2>Content library</h2>
          <p>All lessons and questions live in one validated bilingual JSON file.</p>
          <code>content-libraries/library.json</code>
        </article>
        <article className="architecture-item">
          <GitBranch size={20} />
          <h2>React client</h2>
          <p>The interface keeps navigation, progress, and rendering in small focused modules.</p>
          <code>src/</code>
        </article>
        <article className="architecture-item">
          <Server size={20} />
          <h2>Read-only host</h2>
          <p>The production host serves the build and exposes a small content status endpoint.</p>
          <code>server/content-host.mjs</code>
        </article>
      </section>

      <section className="developer-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{copy("commands")}</span>
            <h2>Run the project</h2>
          </div>
          <button className="icon-button" onClick={copyCommand} title="Copy commands" aria-label="Copy commands">
            {copied ? <Check size={17} /> : <Copy size={17} />}
          </button>
        </div>
        <pre className="command-block">
          <code>{commands.join("\n")}</code>
        </pre>
      </section>

      <section className="developer-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONTENT WORKFLOW</span>
            <h2>Keep English canonical</h2>
          </div>
          <Terminal size={19} />
        </div>
        <ol className="workflow-list">
          <li>Edit the English value first, then update the matching Chinese value.</li>
          <li>Use a stable kebab-case identifier for every term and question.</li>
          <li>Link concepts with <code>[[term:term-id|label]]</code>.</li>
          <li>Run <code>npm run validate</code> before opening a pull request.</li>
        </ol>
      </section>
    </div>
  );
}
