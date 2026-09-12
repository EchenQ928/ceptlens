import { afterEach, expect, it, vi } from 'vitest';
import { contentHostClient } from './contentHostClient';
afterEach(()=>vi.unstubAllGlobals());
it.each(['questions','terms'] as const)('uploads all selected %s as separate multipart files in one request',async kind=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({ok:true,imported:2})));vi.stubGlobal('fetch',fetchMock);
  const extension=kind==='questions'?'json':'zip';
  const files=[new File(['first'],`first.${extension}`),new File(['second'],`second.${extension}`)];
  await (kind==='questions'?contentHostClient.importQuestionFiles:contentHostClient.importTermPackages)(files,'');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [path,request]=fetchMock.mock.calls[0];
  expect(path).toBe(`api/content/${kind}/import-files`);
  expect(request.headers).not.toHaveProperty('Content-Type');
  const uploaded=(request.body as FormData).getAll('files') as File[];
  expect(uploaded.map(f=>f.name)).toEqual(files.map(f=>f.name));
  expect(await Promise.all(uploaded.map(f=>f.text()))).toEqual(['first','second']);
});
