import { expect, it } from 'vitest';
import raw from '../../content-libraries/templates/question-choice.template.json';
import { matchesFeatured } from './featured';
import { hydrateQuestionPackage, questionPackageSchema, toQuestionSource } from './schemas';

it('keeps question and CeptCheck selections independent through import and export', () => {
  const source = { ...raw, featured: false, ceptCheck: { stem: { 'en-US': 'Why?', 'zh-CN': '为什么？' }, featured: true } };
  const question = hydrateQuestionPackage(source);
  expect(matchesFeatured(question, 'question')).toBe(false);
  expect(matchesFeatured(question, 'ceptCheck')).toBe(true);
  const exported = toQuestionSource(question);
  expect(exported.ceptCheck).toEqual(source.ceptCheck);
  expect(exported.featured).toBe(false);
  expect(hydrateQuestionPackage(exported).ceptCheck?.featured).toBe(true);
  expect(matchesFeatured(hydrateQuestionPackage(raw), 'all')).toBe(true);
  expect(matchesFeatured(hydrateQuestionPackage(raw), 'ceptCheck')).toBe(false);
});

it('accepts an independently featured question and rejects malformed selection metadata', () => {
  expect(matchesFeatured(hydrateQuestionPackage({ ...raw, featured: true }), 'question')).toBe(true);
  expect(questionPackageSchema.safeParse({ ...raw, featured: 'yes' }).success).toBe(false);
  expect(questionPackageSchema.safeParse({ ...raw, ceptCheck: { featured: true } }).success).toBe(false);
  expect(questionPackageSchema.safeParse({ ...raw, ceptCheck: { stem: 'Why?', featured: 'yes' } }).success).toBe(false);
});

it('collects term dependencies introduced by a CeptCheck', () => {
  const question = hydrateQuestionPackage({ ...raw, ceptCheck: { stem: 'Explain [[term:gradient|gradient]].', featured: true } });
  expect(question.termDependencies.map(term => term.id)).toContain('gradient');
});
