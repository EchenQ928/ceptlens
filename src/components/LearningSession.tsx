import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { learningRequest, type SessionInfo } from "../infrastructure/learningClient";
import { readProgress, replaceProgress } from "../infrastructure/progressRepository";

interface SessionContext { session: SessionInfo | null; error: string; refresh: () => Promise<void>; rename: (name: string) => Promise<void> }
const Context = createContext<SessionContext>({ session: null, error: "", refresh: async () => {}, rename: async () => {} });
export const useLearningSession = () => useContext(Context);
export function LearningSession({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try { setSession(await learningRequest<SessionInfo>("session")); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Shared service unavailable"); }
  }, []);
  const rename = async (name: string) => { setSession(await learningRequest<SessionInfo>("session", { name })); setError(""); };
  useEffect(() => { void refresh(); const timer = window.setInterval(refresh, 10000); window.addEventListener("focus", refresh); return () => { clearInterval(timer); window.removeEventListener("focus", refresh); }; }, [refresh]);
  useEffect(() => {
    if (!session?.authenticated) return;
    let live = true;
    void learningRequest<{ progress: ReturnType<typeof readProgress> | null }>("progress").then(result => { if (live && result.progress) replaceProgress(result.progress); }).catch(() => {});
    const save = () => { void learningRequest("progress", readProgress()).catch(() => {}); };
    window.addEventListener("progress-change", save); return () => { live = false; window.removeEventListener("progress-change", save); };
  }, [session?.authenticated]);
  return <Context.Provider value={{ session, error, refresh, rename }}>{children}</Context.Provider>;
}
