// @vitest-environment jsdom
import { expect, it } from "vitest";
import { showStartupFailure } from "./startup-recovery";

it("shows actionable recovery without loading any content modules or executing error HTML", () => {
  document.body.innerHTML = '<div id="root"></div>';
  showStartupFailure(new Error('词条 demo 缺少 view.tsx <img src=x onerror=alert(1)>'));
  expect(document.querySelector('[role="alert"]')?.textContent).toContain("demo 缺少 view.tsx");
  expect(document.querySelector("button")?.textContent).toBe("重新加载预览");
  expect(document.querySelector("img")).toBeNull();
});
