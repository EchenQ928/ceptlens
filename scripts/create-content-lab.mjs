import { resolve } from 'node:path';
import { createLabWorkspace } from '../server/lab-workspace.mjs';
const args = process.argv.slice(2);
const destination = args.find(arg => arg !== '--update');
if (!destination) throw new Error('Usage: npm run lab:workspace -- <external-directory> [--update]');
const result = await createLabWorkspace(resolve(import.meta.dirname, '../content-lab'), destination, args.includes('--update'));
console.log(JSON.stringify(result, null, 2));
console.log('In that workspace, run npm ci after installation/update, then npm start. Your drafts stay in content-libraries/.');
