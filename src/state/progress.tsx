import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ProgressState = {
  completedQuestionIds: string[];
  favoriteTermIds: string[];
};

type ProgressContextValue = {
  progress: ProgressState;
  isCompleted: (questionId: string) => boolean;
  isFavorite: (termId: string) => boolean;
  markCompleted: (questionId: string) => void;
  toggleFavorite: (termId: string) => void;
  resetProgress: () => void;
};

export const progressStorageKey = "ceptlens.progress";

export const emptyProgress: ProgressState = {
  completedQuestionIds: [],
  favoriteTermIds: []
};

export function readProgress(storage?: Storage): ProgressState {
  const target = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  if (!target) {
    return emptyProgress;
  }

  try {
    const parsed = JSON.parse(target.getItem(progressStorageKey) ?? "null") as Partial<ProgressState> | null;
    return {
      completedQuestionIds: Array.isArray(parsed?.completedQuestionIds)
        ? [...new Set(parsed.completedQuestionIds.filter((id): id is string => typeof id === "string"))]
        : [],
      favoriteTermIds: Array.isArray(parsed?.favoriteTermIds)
        ? [...new Set(parsed.favoriteTermIds.filter((id): id is string => typeof id === "string"))]
        : []
    };
  } catch {
    return emptyProgress;
  }
}

export function writeProgress(progress: ProgressState, storage?: Storage): void {
  const target = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  target?.setItem(progressStorageKey, JSON.stringify(progress));
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => readProgress());

  const update = (next: ProgressState) => {
    setProgress(next);
    writeProgress(next);
  };

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      isCompleted: (questionId) => progress.completedQuestionIds.includes(questionId),
      isFavorite: (termId) => progress.favoriteTermIds.includes(termId),
      markCompleted: (questionId) => {
        if (progress.completedQuestionIds.includes(questionId)) {
          return;
        }
        update({
          ...progress,
          completedQuestionIds: [...progress.completedQuestionIds, questionId]
        });
      },
      toggleFavorite: (termId) => {
        const favoriteTermIds = progress.favoriteTermIds.includes(termId)
          ? progress.favoriteTermIds.filter((id) => id !== termId)
          : [...progress.favoriteTermIds, termId];
        update({ ...progress, favoriteTermIds });
      },
      resetProgress: () => update(emptyProgress)
    }),
    [progress]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used inside ProgressProvider");
  }
  return context;
}
