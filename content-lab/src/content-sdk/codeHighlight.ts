import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);

/** Explicit language only: unknown code remains escaped plain text in React. */
export function highlightCode(code: string, language: string): string | null {
  const name = language.trim().toLowerCase();
  return hljs.getLanguage(name) ? hljs.highlight(code, { language: name, ignoreIllegals: true }).value : null;
}
