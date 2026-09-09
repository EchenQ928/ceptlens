import { randomInt, randomUUID } from 'node:crypto';
import { problem } from './community-store.mjs';

export const examPlan = { minutes: 30, single_choice: 5, multiple_choice: 5, subjective: 2 };
export const pointsFor = type => type === 'subjective' ? 25 : 5;
export function readiness(questions) {
  return Object.keys(examPlan).filter(k => k !== 'minutes').map(type => ({ type, available: questions.filter(q => q.type === type).length, required: examPlan[type] }));
}
export function createAttempt(questions, owner, name, now = Date.now()) {
  const selected = [];
  for (const { type, required } of readiness(questions)) {
    const pool = questions.filter(q => q.type === type);
    for (let count = 0; count < required && pool.length; count++) selected.push(pool.splice(randomInt(pool.length), 1)[0]);
  }
  if (!selected.length) throw problem('题库为空，请先导入题目。');
  return { id: randomUUID(), owner, name, status: 'active', revision: 0, startedAt: now, deadline: now + examPlan.minutes * 60000, submittedAt: null, completePaper: selected.length === 12, questions: structuredClone(selected), answers: {}, results: null, total: null };
}
export function validateAnswers(attempt, answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw problem('答卷格式无效。');
  for (const [id, answer] of Object.entries(answers)) {
    const q = attempt.questions.find(item => item.id === id);
    if (!q) throw problem('答卷包含本卷之外的题目。');
    if (q.type === 'subjective') {
      if (typeof answer !== 'string' || answer.length > 12000) throw problem('主观题作答最多 12000 字。');
    } else if (!Array.isArray(answer) || answer.length > q.options.length || new Set(answer).size !== answer.length || (q.type === 'single_choice' && answer.length > 1) || answer.some(key => !q.options.some(o => o.key === key))) throw problem('选项答案无效。');
  }
  return structuredClone(answers);
}
export function finishAttempt(attempt, now = Date.now()) {
  if (attempt.status !== 'active') return attempt;
  attempt.status = 'submitted'; attempt.submittedAt = Math.min(now, attempt.deadline); attempt.revision++;
  attempt.results = attempt.questions.map(q => {
    const answer = attempt.answers[q.id] ?? (q.type === 'subjective' ? '' : []);
    const maxScore = pointsFor(q.type);
    if (q.type === 'subjective') return { id: q.id, state: 'pending', score: null, maxScore, reason: '暂未接入评分 API，无法打分。' };
    const correct = answer.length === q.correctAnswer.length && answer.every(key => q.correctAnswer.includes(key));
    return { id: q.id, state: correct ? 'correct' : 'incorrect', score: correct ? maxScore : 0, maxScore };
  });
  updateTotal(attempt); return attempt;
}
export function updateTotal(attempt) {
  attempt.objectiveScore = (attempt.results ?? []).filter(r => r.state !== 'pending' && attempt.questions.find(q => q.id === r.id)?.type !== 'subjective').reduce((sum, r) => sum + r.score, 0);
  attempt.objectiveMax = attempt.questions.filter(q => q.type !== 'subjective').reduce(sum => sum + 5, 0);
  attempt.total = attempt.completePaper && attempt.results?.every(r => r.score !== null) ? attempt.results.reduce((sum, r) => sum + r.score, 0) : null;
}
export function publicAttempt(attempt, now = Date.now()) {
  const { owner, ...result } = structuredClone(attempt);
  if (result.status === 'active') result.questions = result.questions.map(({ explanation, correctAnswer, subjectiveAnswer, ...q }) => q);
  return { ...result, serverNow: now };
}
