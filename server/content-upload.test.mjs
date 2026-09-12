import { expect, it } from 'vitest';
import { readUploadFiles, maximumBatchFiles } from './content-upload.mjs';

async function parse(files, extension='.json') {
  const form=new FormData();
  for(const [name, body] of files)form.append('files',new Blob([body]),name);
  const request=new Request('http://localhost/upload',{method:'POST',body:form});
  return readUploadFiles(Buffer.from(await request.arrayBuffer()),request.headers.get('content-type'),extension);
}
it('keeps individual filenames and bytes in a multipart selection', async()=>{
  const files=await parse([['first.json','{"id":"one"}'],['第二题.json','{"id":"two"}']]);
  expect(files.map(f=>[f.name,f.buffer.toString()])).toEqual([['first.json','{"id":"one"}'],['第二题.json','{"id":"two"}']]);
  const terms=await parse([['a.zip',new Uint8Array([0,255,4])],['b.zip',new Uint8Array([3,2,1])]],'.zip');
  expect([...terms[0].buffer]).toEqual([0,255,4]);
});
it('rejects an empty selection, empty files, wrong extensions, and oversized file counts',async()=>{
  await expect(parse([])).rejects.toThrow('Select between');
  await expect(parse([['empty.json','']])).rejects.toThrow('empty.json');
  await expect(parse([['bad.zip','abc']])).rejects.toThrow('.json');
  await expect(parse(Array.from({length:maximumBatchFiles+1},(_,i)=>[`${i}.json`,'{}']))).rejects.toThrow('Select between');
});
it('rejects malformed multipart requests and text fields masquerading as files',async()=>{
  await expect(readUploadFiles(Buffer.from('bad'),'application/json','.json')).rejects.toThrow('multipart');
  const form=new FormData();form.append('files','fake.json');
  const request=new Request('http://localhost/upload',{method:'POST',body:form});
  await expect(readUploadFiles(Buffer.from(await request.arrayBuffer()),request.headers.get('content-type'),'.json')).rejects.toThrow('.json');
});
