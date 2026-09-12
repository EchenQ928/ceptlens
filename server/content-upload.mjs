export const maximumBatchFiles = 100;

// The host bounds the complete request body before parsing multipart data.
export async function readUploadFiles(buffer, contentType, extension) {
  if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) throw new Error('Expected a multipart file upload.');
  const form = await new Request('http://localhost/upload', {
    method: 'POST', headers: { 'Content-Type': contentType }, body: buffer,
  }).formData();
  const files = form.getAll('files');
  if (!files.length || files.length > maximumBatchFiles) throw new Error(`Select between 1 and ${maximumBatchFiles} files.`);
  const result = [];
  for (const file of files) {
    if (typeof file === 'string' || !file.name.toLowerCase().endsWith(extension)) throw new Error(`Every selected file must be a ${extension} file.`);
    if (!file.size) throw new Error(`${file.name}: the file is empty.`);
    result.push({ name: file.name, buffer: Buffer.from(await file.arrayBuffer()) });
  }
  return result;
}
