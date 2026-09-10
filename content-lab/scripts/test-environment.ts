// Browser tests must use jsdom storage, not Node's native storage global.
// Node 26 exposes localStorage as undefined unless a storage file is configured.
// Vitest aliases window to globalThis; its jsdom handle is the actual DOM window.
const browser = (globalThis as typeof globalThis & { jsdom?: { window: Window } }).jsdom?.window;
if (browser) {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: browser.localStorage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: browser.sessionStorage });
}
