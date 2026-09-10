import { spawn } from "node:child_process";
import process from "node:process";

const port = 4300 + Math.floor(Math.random() * 200);
const child = spawn(process.execPath, ["server/content-host.mjs"], {
  env: {
    ...process.env,
    CEPTLENS_PORT: String(port),
    CEPTLENS_PUBLIC_ORIGIN: "https://ceptlens.example",
    NODE_ENV: "test"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

async function waitForStatus() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/content/status`);
      if (response.ok) {
        return response.json();
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Host did not become ready.\n${output}`);
}

try {
  const status = await waitForStatus();
  if (
    status.ok !== true ||
    status.version !== "1.0.0" ||
    status.publicUrl !== "https://ceptlens.example" ||
    status.questionCount !== 34 ||
    status.termCount !== 27
  ) {
    throw new Error(`Unexpected content status: ${JSON.stringify(status)}`);
  }

  const page = await fetch(`http://127.0.0.1:${port}/`);
  if (!page.ok || !(await page.text()).includes("<div id=\"root\">")) {
    throw new Error("Root page did not serve the built app.");
  }
  console.log(`Verified host status and root page on port ${port}.`);
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("close", resolve));
}
