// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import raw from '../../content-libraries/templates/question-choice.template.json';
import { hydrateQuestionPackage } from '../domain/schemas';
import { LearnCatalogPage } from './LearnCatalogPage';

vi.mock('../hooks/useContent', () => ({ useContent: () => ({ terms: [], questions: [
  hydrateQuestionPackage({ ...raw, id: 'plain', stem: 'Ordinary question' }),
  hydrateQuestionPackage({ ...raw, id: 'question-pick', stem: 'Question pick', featured: true }),
  hydrateQuestionPackage({ ...raw, id: 'check-pick', stem: 'Check pick', ceptCheck: { stem: 'Why?', featured: true } }),
  hydrateQuestionPackage({ ...raw, id: 'both-picks', stem: 'Both picks', featured: true, ceptCheck: { stem: 'Why?', featured: true } })
] }) }));

it('filters independent featured selections, shows badges, and resets to all questions', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  const rows = () => [...container.querySelectorAll('.question-list-row')];
  const filterButton = (label: string) => [...container.querySelectorAll('.featured-filter button')].find(button => button.textContent?.startsWith(label)) as HTMLButtonElement;
  try {
    await act(() => root.render(<MemoryRouter><LearnCatalogPage /></MemoryRouter>));
    expect(rows()).toHaveLength(4);
    await act(() => filterButton('精选 CeptCheck').click());
    expect(rows()).toHaveLength(2);
    expect(rows().every(row => row.textContent?.includes('精选 CeptCheck'))).toBe(true);
    expect(rows().map(row => row.getAttribute('href'))).toContain('/learn/questions/check-pick?mode=practice');
    await act(() => filterButton('精选题目').click());
    expect(rows()).toHaveLength(2);
    expect(rows().every(row => row.textContent?.includes('精选题目'))).toBe(true);
    const reset = [...container.querySelectorAll('button')].find(button => button.textContent?.includes('重置筛选'))!;
    await act(() => reset.click());
    expect(rows()).toHaveLength(4);
    expect(filterButton('全部').getAttribute('aria-pressed')).toBe('true');
  } finally { await act(() => root.unmount()); container.remove(); }
});
