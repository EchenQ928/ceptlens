import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';

const controls = '.primary-button,.secondary-button,.focus-toggle,.flow-link,.top-navigation a,.mode-segment button,.track-switch button,.companion-dock button,.concept-pills a,.favorite-button,.option-row,.term-card,.aura-mode-card,.auth-mode-tabs button,.kind-tabs button,.lab-selector nav a,.lab-preview-controls button';
/** One delegated controller, no per-card RAF loops or React renders on pointer movement. */
export function LiquidInteractions() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const animations = new Map<Element, Animation>();
    let pressed: HTMLElement | null = null;
    let hover: HTMLElement | null = null;
    let pointer = { x: 0, y: 0 }, frame = 0;
    function find(target: EventTarget | null) {
      const element = target instanceof Element ? target.closest<HTMLElement>(controls) : null;
      return element && !element.matches(':disabled,[aria-disabled="true"]') ? element : null;
    }
    function movingPart(element: HTMLElement) {
      return element.matches('.option-row') ? element.querySelector<HTMLElement>('.option-key') ?? element :
        element.matches('.term-card,.aura-mode-card') ? element.querySelector<HTMLElement>('.concept-symbol,.aura-icon-tile') ?? element : element;
    }
    function play(element: HTMLElement, release: boolean) {
      const part = movingPart(element);
      animations.get(part)?.cancel();
      if (!part.animate) return;
      const animation = part.animate(release ? [
        { scale: '.96 .94' }, { scale: '1.055 .955', offset: .32 },
        { scale: '.985 1.02', offset: .65 }, { scale: '1 1' }
      ] : [{ scale: '1 1' }, { scale: '.96 .94' }], {
        duration: release ? 520 : 130, easing: release ? 'cubic-bezier(.22,.8,.28,1)' : 'ease-out', fill: release ? 'none' : 'forwards'
      });
      animations.set(part, animation);
      animation.onfinish = () => { if (release) animations.delete(part); };
      if (release) {
        const icon = element.querySelector<SVGElement>('.product-icon');
        if (icon?.animate) {
          animations.get(icon)?.cancel();
          const iconAnimation = icon.animate([{ transform:'scale(.84) rotate(-7deg)' }, { transform:'scale(1.13) rotate(3deg)', offset:.42 }, { transform:'scale(1) rotate(0)' }], { duration:560, easing:'cubic-bezier(.22,1,.36,1)' });
          animations.set(icon,iconAnimation); iconAnimation.onfinish = () => animations.delete(icon);
        }
      }
    }
    const down = (event: PointerEvent) => { if (event.button !== 0) return; pressed = find(event.target); if (pressed) play(pressed,false); };
    const up = () => { if (pressed) { play(pressed,true); pressed = null; } };
    const cancel = () => { if (pressed) { const part = movingPart(pressed); animations.get(part)?.cancel(); animations.delete(part); pressed = null; } };
    const click = (event: MouseEvent) => { if (event.detail === 0) { const element = find(event.target); if (element) play(element,true); } };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const element = find(event.target);
      if (hover !== element) { hover?.style.removeProperty('--liquid-x'); hover?.style.removeProperty('--liquid-y'); hover = element; }
      pointer = { x:event.clientX,y:event.clientY };
      if (!frame && hover) frame = requestAnimationFrame(() => {
        frame = 0; if (!hover) return;
        const rect = hover.getBoundingClientRect();
        hover.style.setProperty('--liquid-x',`${Math.max(0,Math.min(100,(pointer.x-rect.left)/rect.width*100))}%`);
        hover.style.setProperty('--liquid-y',`${Math.max(0,Math.min(100,(pointer.y-rect.top)/rect.height*100))}%`);
      });
    };
    const hide = () => { if (document.hidden) { cancel(); animations.forEach(animation => animation.cancel()); animations.clear(); cancelAnimationFrame(frame); frame=0; } };
    document.addEventListener('pointerdown',down,true); document.addEventListener('pointerup',up,true);
    document.addEventListener('pointercancel',cancel,true); document.addEventListener('click',click,true);
    document.addEventListener('pointermove',move,{ passive:true }); document.addEventListener('visibilitychange',hide);
    window.addEventListener('blur',cancel);
    return () => { document.removeEventListener('pointerdown',down,true); document.removeEventListener('pointerup',up,true); document.removeEventListener('pointercancel',cancel,true); document.removeEventListener('click',click,true); document.removeEventListener('pointermove',move); document.removeEventListener('visibilitychange',hide); window.removeEventListener('blur',cancel); cancelAnimationFrame(frame); animations.forEach(animation => animation.cancel()); hover?.style.removeProperty('--liquid-x'); hover?.style.removeProperty('--liquid-y'); };
  },[reduced]);
  return null;
}
