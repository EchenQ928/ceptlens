// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import raw from '../../content-libraries/templates/question-choice.template.json';
import { hydrateQuestionPackage } from '../domain/schemas';
import { QuestionLibrary } from './QuestionLibrary';

vi.mock('../hooks/useContent', () => ({ useContent: () => ({ terms: [], questions: [
  hydrateQuestionPackage({ ...raw, id: 'plain', stem: 'Ordinary question' }),
  hydrateQuestionPackage({ ...raw, id: 'check-pick', stem: 'Check pick', ceptCheck: { stem: 'Why?', featured: true } })
] }) }));

it('finds a selected CeptCheck and handles an empty featured-question selection', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  const rows = () => container.querySelectorAll('.lab-question-link');
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('.featured-filter button')].find(button => button.textContent?.startsWith(label)) as HTMLButtonElement;
    await act(() => button.click());
  };
  try {
    await act(() => root.render(<MemoryRouter><QuestionLibrary /></MemoryRouter>));
    expect(rows()).toHaveLength(2);
    await click('精选 CeptCheck');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].getAttribute('href')).toBe('/learn/questions/check-pick');
    await click('精选题目');
    expect(rows()).toHaveLength(0);
    expect(container.textContent).toContain('没有匹配的精选内容');
    await click('全部');
    expect(rows()).toHaveLength(2);
  } finally { await act(() => root.unmount()); container.remove(); }
});
