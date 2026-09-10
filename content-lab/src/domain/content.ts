import type React from "react";

export type RichText = string;
export type QuestionType = "single_choice" | "multiple_choice" | "subjective";

export interface QuestionOption {
  key: string;
  text: RichText;
}

export interface QuestionTaxonomy {
  primaryConcept: string;
  modelFamily: string;
  learningLevel: string;
  engineeringStage: string;
  priority: "P0" | "P1" | "P2" | "P3";
  secondaryModelFamilies: string[];
  secondaryEngineeringStages: string[];
  knowledgeTopics: string[];
  taskScenarios: string[];
  optimizationObjectives: string[];
  runtimeEnvironments: string[];
}

export interface QuestionOrdering {
  order: number;
  prerequisites: string[];
}

export interface TermDependency {
  id: string;
  title: string;
  reason: string;
}

export interface SubjectiveRubricItem {
  criterion: RichText;
  points: number;
}

export interface SubjectiveAnswerSpec {
  referenceAnswer: RichText;
  rubric: SubjectiveRubricItem[];
  gradingInstruction?: RichText;
}
export interface CeptCheckSpec { stem: RichText; referenceAnswer: RichText; explanation: RichText; }

/** Runtime question. Author files omit termDependencies; the platform derives them from explicit links. */
export interface QuestionPackage {
  schemaVersion: "3.0";
  id: string;
  type: QuestionType;
  stem: RichText;
  options: QuestionOption[];
  correctAnswer: string[];
  explanation: RichText;
  ceptCheck?: CeptCheckSpec;
  subjectiveAnswer?: SubjectiveAnswerSpec;
  taxonomy: QuestionTaxonomy;
  ordering: QuestionOrdering;
  termDependencies: TermDependency[];
}

export interface TermNavigationItem {
  id: string;
  title: string;
}

/** Runtime term metadata. Teaching content remains completely custom in view.tsx. */
export interface TermPackage {
  schemaVersion: "3.0";
  sdkVersion: "1.x";
  id: string;
  title: string;
  aliases: string[];
  summary: RichText;
  coreConclusion: RichText;
  prerequisites: string[];
  termDependencies: TermDependency[];
}

export interface QuestionBundle {
  schemaVersion: "3.0";
  kind: "question-bundle";
  exportedAt: string;
  questions: Array<Omit<QuestionPackage, "termDependencies">>;
}

export interface TermViewDefinition {
  termId: string;
  Component: React.ComponentType;
}
