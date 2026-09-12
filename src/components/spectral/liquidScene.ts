/** DOM geometry only: the shader refracts our light field, never captures page text. */
export const LIQUID_LIMIT = 12;
const surfaces = '.question-panel,.term-article,.filter-panel,.question-table,.assessment-card,.exam-question-card,.term-card,.study-catalog,.study-context .context-section,.assessment-heading,.concept-collection,.welcome-form-card,.aura-mode-card,.page>.panel,.developer-list,.agent-developer-panel,.host-status-panel,.editor-shell,.term-package-inspector,.term-package-empty,.lab-dialog';
export function emptyLiquidUniforms() {
  return { u_glass: Array.from({ length: LIQUID_LIMIT }, () => [0, 0, 0, 0]), u_glassRadius: Array.from({ length: LIQUID_LIMIT }, () => [0, 0]), u_glassCount: 0, u_viewport: [1, 1], u_scroll: [0, 0] };
}
export function liquidShaderUniforms(material: ReturnType<typeof emptyLiquidUniforms>) {
  const { u_glass, u_glassRadius, ...rest } = material;
  return { ...rest, 'u_glass[0]': u_glass, 'u_glassRadius[0]': u_glassRadius };
}
export function createLiquidScene(backdrop: HTMLElement) {
  const scope = backdrop.closest('.app-frame,.welcome-page') ?? backdrop.parentElement!;
  let dirty = true, changedUntil = 0, elements: HTMLElement[] = [];
  let active = new Set<HTMLElement>();
  let targetScroll = window.scrollY, scroll = targetScroll, velocity = 0;
  let previousScroll = targetScroll, lastScrollTime = performance.now();
  let data = emptyLiquidUniforms();
  const invalidate = () => { dirty = true; changedUntil = performance.now() + 650; };
  const scan = () => { elements = Array.from(scope.querySelectorAll<HTMLElement>(surfaces)); invalidate(); };
  const onScroll = () => {
    const now = performance.now(), y = window.scrollY;
    velocity = Math.max(-2, Math.min(2, (y - previousScroll) / Math.max(16, now - lastScrollTime)));
    previousScroll = y; lastScrollTime = now; targetScroll = y; invalidate();
  };
  const mutation = new MutationObserver(scan);
  mutation.observe(scope, { childList: true, subtree: true });
  const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidate) : null;
  resize?.observe(scope);
  window.addEventListener('resize', invalidate);
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  scan();
  return {
    read(now: number, elapsed: number) {
      const damping = 1 - Math.exp(-elapsed / 120);
      scroll += (targetScroll - scroll) * damping;
      velocity *= Math.exp(-elapsed / 180);
      if (dirty || now < changedUntil) {
        const frame = backdrop.getBoundingClientRect();
        const width = Math.max(1, frame.width), height = Math.max(1, frame.height);
        const visible = elements.map(element => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 40 && rect.height > 40 && rect.bottom > frame.top && rect.top < frame.bottom && rect.right > frame.left && rect.left < frame.right)
          .slice(0, LIQUID_LIMIT);
        data = emptyLiquidUniforms();
        data.u_viewport = [width, height];
        data.u_glassCount = visible.length;
        const nextActive = new Set(visible.map(item => item.element));
        active.forEach(element => { if (!nextActive.has(element)) delete element.dataset.liquidSurface; });
        nextActive.forEach(element => { if (!active.has(element)) element.dataset.liquidSurface = 'true'; });
        active = nextActive;
        visible.forEach(({ element, rect }, i) => {
          data.u_glass[i] = [rect.left - frame.left + rect.width / 2, rect.top - frame.top + rect.height / 2, rect.width / 2, rect.height / 2];
          data.u_glassRadius[i] = [Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0, rect.width / 2, rect.height / 2), element.matches('.term-card,.study-context .context-section') ? 1.25 : 1];
        });
        dirty = false;
      }
      return { ...data, u_scroll: [scroll / Math.max(1, innerHeight), velocity] };
    },
    dispose() { mutation.disconnect(); resize?.disconnect(); window.removeEventListener('resize', invalidate); document.removeEventListener('scroll', onScroll, true); active.forEach(element => { delete element.dataset.liquidSurface; }); }
  };
}
