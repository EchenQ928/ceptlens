import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const AmbientContext = createContext({ paused: false, focused: false, setFocused: (_value: boolean) => {}, togglePaused: () => {} });
export function VisualEnvironment({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const value = useMemo(() => ({ paused, focused, setFocused, togglePaused: () => setPaused(value => !value) }), [paused, focused]);
  return <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>;
}
export function useVisualEnvironment() { return useContext(AmbientContext); }
