import { useEffect, useState } from "react";
import { readProgress } from "../infrastructure/progressRepository";

export function useProgress() {
  const [progress, setProgress] = useState(readProgress);
  useEffect(() => {
    const refresh = () => setProgress(readProgress());
    window.addEventListener("progress-change", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("progress-change", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  return progress;
}
