export type SpectralPreset = "home" | "learn" | "concepts" | "assess" | "account" | "auth";
export const spectralPresets: Record<SpectralPreset, { workspace: number; intensity: number; tone: number; speed: number }> = {
  home: { workspace: 0, intensity: 1, tone: 0, speed: 1 },
  learn: { workspace: 1, intensity: .88, tone: 0, speed: .35 },
  concepts: { workspace: 1, intensity: .9, tone: .8, speed: .35 },
  assess: { workspace: 1, intensity: .62, tone: -.6, speed: .2 },
  account: { workspace: 1, intensity: .7, tone: 0, speed: .3 },
  auth: { workspace: 0, intensity: .85, tone: .2, speed: .5 }
};
export function canAnimate({ paused, reduced, visible, inView, failed }: { paused: boolean; reduced: boolean; visible: boolean; inView: boolean; failed: boolean }) {
  return !paused && !reduced && visible && inView && !failed;
}
/** Ignore isolated long frames; two sustained slow windows reduce quality then stop. */
export function nextQuality(fps: number, current: "full" | "low" | "poster") {
  if (current === "full" && fps < 45) return "low";
  if (current === "low" && fps < 30) return "poster";
  return current;
}
