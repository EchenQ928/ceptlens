import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { learningRequest, type SessionInfo } from "../infrastructure/learningClient";

interface SessionContext { session: SessionInfo | null; error: string; refresh: () => Promise<void>; rename: (name: string) => Promise<void> }
const Context = createContext<SessionContext>({ session: null, error: "", refresh: async () => {}, rename: async () => {} });
export const useLearningSession = () => useContext(Context);
export function LearningSession({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try { setSession(await learningRequest<SessionInfo>("session")); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "共享服务未连接"); }
  }, []);
  const rename = async (name: string) => { setSession(await learningRequest<SessionInfo>("session", { name })); setError(""); };
  useEffect(() => { void refresh(); const timer = window.setInterval(refresh, 10000); window.addEventListener("focus", refresh); return () => { clearInterval(timer); window.removeEventListener("focus", refresh); }; }, [refresh]);
  return <Context.Provider value={{ session, error, refresh, rename }}>{children}</Context.Provider>;
}
