import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale, LocalizedText } from "./domain/content";

const localeStorageKey = "ceptlens.locale";

const uiCopy = {
  en: {
    appName: "CeptLens",
    tagline: "Learn the model. Understand the runtime.",
    navOverview: "Overview",
    navLearn: "Learn",
    navTerms: "Term library",
    navAssess: "Assessment",
    navDevelopers: "Developers",
    switchToChinese: "中文",
    switchToEnglish: "English",
    languageLabel: "Language",
    openMenu: "Open navigation",
    closeMenu: "Close navigation",
    startLearning: "Start learning",
    continueLearning: "Continue learning",
    reviewTerms: "Review term library",
    takeAssessment: "Take assessment",
    progress: "Progress",
    completed: "completed",
    questions: "questions",
    terms: "terms",
    question: "Question",
    questionsAvailable: "questions available",
    allTopics: "All topics",
    allLevels: "All levels",
    searchTerms: "Search terms",
    noResults: "No matching content.",
    checkAnswer: "Check answer",
    nextQuestion: "Next question",
    showExplanation: "Explanation",
    correct: "Correct",
    review: "Review",
    correctHeadline: "Good read.",
    reviewHeadline: "Keep the distinction clear.",
    answer: "Answer",
    successMark: "OK",
    reviewMark: "READ",
    tryAgain: "Try again",
    addFavorite: "Add favorite",
    removeFavorite: "Remove favorite",
    selectOne: "Select one answer",
    selectMultiple: "Select all that apply",
    relatedTerms: "Related terms",
    coreIdea: "Core idea",
    mechanism: "Mechanism",
    engineeringNotes: "Engineering notes",
    backToLearn: "Back to learning",
    assessmentTitle: "Assessment",
    assessmentIntro: "A short checkpoint across the full learning path.",
    startAssessment: "Start assessment",
    finishAssessment: "Finish assessment",
    assessmentScore: "Your score",
    restartAssessment: "Restart assessment",
    overviewTitle: "A compact path through model engineering",
    overviewDescription:
      "CeptLens turns core AI model concepts into short lessons and objective checks. Your progress stays in this browser.",
    learningPath: "Learning path",
    learningPathDescription: "Move from foundations to architecture, training, and deployment.",
    recentCheckpoint: "Next checkpoint",
    noProgress: "No completed questions yet",
    noProgressDescription: "Start with the first question and build a durable mental model.",
    bilingualContent: "English-first, bilingual content",
    bilingualDescription:
      "The source structure is written for global contributors. Every lesson keeps English and Chinese together.",
    developerTitle: "Built for contributors",
    developerDescription:
      "One JSON library, a small React client, and a read-only Node host keep the project easy to understand.",
    developerLink: "Read the developer guide",
    stage: "Stage",
    level: "Level",
    topic: "Topic",
    sourceOfTruth: "Source of truth",
    commands: "Useful commands",
    back: "Back",
    next: "Next",
    languageChanged: "Language changed",
    notFoundTitle: "This page is not available",
    notFoundDescription: "The requested lesson or term could not be found.",
    returnOverview: "Return to overview"
  },
  zh: {
    appName: "CeptLens",
    tagline: "理解模型，也理解运行时。",
    navOverview: "总览",
    navLearn: "学习",
    navTerms: "术语库",
    navAssess: "测评",
    navDevelopers: "开发者",
    switchToChinese: "中文",
    switchToEnglish: "English",
    languageLabel: "语言",
    openMenu: "打开导航",
    closeMenu: "关闭导航",
    startLearning: "开始学习",
    continueLearning: "继续学习",
    reviewTerms: "复习术语库",
    takeAssessment: "参加测评",
    progress: "进度",
    completed: "已完成",
    questions: "道题",
    terms: "个术语",
    question: "问题",
    questionsAvailable: "道题可用",
    allTopics: "全部主题",
    allLevels: "全部难度",
    searchTerms: "搜索术语",
    noResults: "没有匹配内容。",
    checkAnswer: "检查答案",
    nextQuestion: "下一题",
    showExplanation: "解析",
    correct: "正确",
    review: "复习",
    correctHeadline: "理解得不错。",
    reviewHeadline: "把这个区别记清楚。",
    answer: "答案",
    successMark: "正确",
    reviewMark: "复习",
    tryAgain: "再试一次",
    addFavorite: "加入收藏",
    removeFavorite: "取消收藏",
    selectOne: "选择一个答案",
    selectMultiple: "选择所有正确答案",
    relatedTerms: "相关术语",
    coreIdea: "核心思路",
    mechanism: "机制",
    engineeringNotes: "工程要点",
    backToLearn: "返回学习",
    assessmentTitle: "测评",
    assessmentIntro: "覆盖完整学习路径的短测评。",
    startAssessment: "开始测评",
    finishAssessment: "完成测评",
    assessmentScore: "你的得分",
    restartAssessment: "重新测评",
    overviewTitle: "一条紧凑的模型工程学习路径",
    overviewDescription: "CeptLens 把 AI 模型核心概念拆成短课和客观题。学习进度只保存在当前浏览器中。",
    learningPath: "学习路径",
    learningPathDescription: "从基础概念进入架构、训练和部署。",
    recentCheckpoint: "下一个检查点",
    noProgress: "还没有完成题目",
    noProgressDescription: "从第一题开始，逐步建立可靠的心智模型。",
    bilingualContent: "English-first 双语内容",
    bilingualDescription: "源代码结构面向全球贡献者。每个课程同时维护英文和中文。",
    developerTitle: "为贡献者而生",
    developerDescription: "一个 JSON 内容库、一个小型 React 客户端和一个只读 Node 主机，让项目容易理解。",
    developerLink: "阅读开发者指南",
    stage: "阶段",
    level: "难度",
    topic: "主题",
    sourceOfTruth: "唯一内容源",
    commands: "常用命令",
    back: "返回",
    next: "下一步",
    languageChanged: "语言已切换",
    notFoundTitle: "页面不存在",
    notFoundDescription: "找不到请求的课程或术语。",
    returnOverview: "返回总览"
  }
} as const;

export type CopyKey = keyof typeof uiCopy.en;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  pick: (text: LocalizedText) => string;
  copy: (key: CopyKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function initialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  return window.localStorage.getItem(localeStorageKey) === "zh" ? "zh" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    window.localStorage.setItem(localeStorageKey, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      pick: (text) => text[locale] || text.en,
      copy: (key) => uiCopy[locale][key] || uiCopy.en[key]
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return context;
}

export function useCopy() {
  return useLocale().copy;
}
