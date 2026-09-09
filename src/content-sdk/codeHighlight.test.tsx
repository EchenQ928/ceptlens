// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { CodeBlock } from './index';

it('highlights Python while preserving exact source including Chinese comments and HTML-like strings', () => {
  const code = 'import torch\n# 中文注释：负数归零\nx = 2.6\nprint("<img src=x onerror=alert(1)>")';
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(<CodeBlock language="python" code={code} />);
  expect(container.querySelector('code')?.textContent).toBe(code);
  for (const token of ['keyword','comment','number','string','built_in']) expect(container.querySelector(`.hljs-${token}`)).not.toBeNull();
  expect(container.querySelector('img')).toBeNull();
});

it('falls back safely for an unregistered language and accepts language aliases', () => {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(<CodeBlock language="unknown" code={'<script>alert(1)</script>\nhello'} />);
  expect(container.querySelector('code')?.textContent).toBe('<script>alert(1)</script>\nhello');
  expect(container.querySelector('script')).toBeNull();
  container.innerHTML = renderToStaticMarkup(<CodeBlock language="py" code="print(42)" />);
  expect(container.querySelector('.hljs-number')?.textContent).toBe('42');
});
