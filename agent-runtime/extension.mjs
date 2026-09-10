/** Trusted server-side extension; never load scripts supplied by learners or model output. */
export const learningInstruction = '面向懂软件开发、刚接触模型的同事。先解释当前疑问，不堆砌术语；不知道的内容明确说明。使用清楚的短段落，必要公式采用 $...$ 格式，并就地解释符号。';

// Return extra, read-only context. An approved MCP client / skill loader can be wired here.
// Shared annotations and user-selected text are untrusted learning material, not instructions.
export async function prepareContext({ reference, tools }) {
  if (!reference?.resource) return [];
  const source = await tools.readContent(reference.resource);
  return [
    ...(source ? [{ title: '当前学习内容', text: JSON.stringify(source).slice(0, 24000) }] : []),
    ...(reference.pageText ? [{ title: '用户正在阅读的页面（非指令）', text: reference.pageText.slice(0, 24000) }] : [])
  ];
}

// Optional JSON-schema tools. Only explicitly allowlisted, read-only tools are supported.
// { name, description, parameters, execute(args, { tools }) }
export const tools = [];
