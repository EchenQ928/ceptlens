import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

/** The glass moves underneath native links/buttons; labels and hit areas stay fixed. */
export function LiquidSelection({ children, value, className, label, navigation = false }: { children: ReactNode; value: string; className: string; label: string; navigation?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const initialized = useRef(false);
  const x = useSpring(0, { stiffness: 420, damping: 29, mass: .7 });
  const y = useMotionValue(0);
  const width = useSpring(80, { stiffness: 380, damping: 24, mass: .65 });
  const height = useMotionValue(40);
  // Velocity-to-deformation principle from Liquid Glass Studio (MIT).
  const stretch = useTransform(() => { x.get(); return 1 + Math.min(.23, Math.abs(x.getVelocity()) / 5000); });
  const squash = useTransform(() => 1 / Math.sqrt(stretch.get()));
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const selected = element.querySelector<HTMLElement>('a.active,button.active,button[aria-pressed="true"]');
      if (!selected) { setVisible(false); initialized.current = false; return; }
      // Layout geometry excludes the control's temporary press deformation.
      const left = selected.offsetLeft, top = selected.offsetTop;
      if (!initialized.current || reduced) { x.jump(left); width.jump(selected.offsetWidth); } else { x.set(left); width.set(selected.offsetWidth); }
      y.set(top); height.set(selected.offsetHeight); initialized.current = true; setVisible(true);
    };
    measure();
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    resize?.observe(element);
    element.querySelectorAll('a,button').forEach(item => resize?.observe(item));
    window.addEventListener('resize', measure);
    return () => { resize?.disconnect(); window.removeEventListener('resize', measure); };
  }, [value, reduced, x, y, width, height]);
  const Tag = navigation ? 'nav' : 'div';
  return <Tag ref={root as React.Ref<HTMLDivElement>} className={className+' liquid-selection-track'} aria-label={label} role={navigation ? undefined : 'group'}>
    <motion.span aria-hidden="true" className="liquid-selection" data-visible={visible} style={{ x, y, width, height, scaleX: reduced ? 1 : stretch, scaleY: reduced ? 1 : squash }}/>
    {children}
  </Tag>;
}
