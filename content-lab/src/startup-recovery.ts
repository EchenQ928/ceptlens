export function showStartupFailure(error: unknown) {
  const root = document.getElementById("root");
  if (!root) return;
  const panel = document.createElement("section");
  panel.className = "empty-state";
  panel.setAttribute("role", "alert");
  const heading = document.createElement("h1");
  heading.textContent = "实验室预览暂时无法加载";
  const explanation = document.createElement("p");
  explanation.textContent = "请先重新加载。若仍失败，请根据下方文件路径检查本机 content-libraries 中的教学包；不要删除整个词条库。";
  const details = document.createElement("pre");
  details.style.whiteSpace = "pre-wrap";
  details.textContent = error instanceof Error ? error.message : String(error);
  const reload = document.createElement("button");
  reload.className = "primary-button";
  reload.textContent = "重新加载预览";
  reload.onclick = () => window.location.reload();
  panel.append(heading, explanation, details, reload);
  root.replaceChildren(panel);
}
