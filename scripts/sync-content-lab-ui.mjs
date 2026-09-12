// Ship platform presentation sources inside the standalone Lab, without a parent-repo dependency.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const check = process.argv.includes('--check');
const styles = ['tokens','global','components','responsive','learning','accounts','lens','aura','aura-dark','study-catalog','spectral','liquid','developer'];
const files = new Map(styles.map(name => [`src/styles/${name}.css`, `src/styles/platform/${name}.css`]));
for (const name of ['QuestionPanel.tsx','ProductIcon.tsx','ConceptSymbol.tsx','Brand.tsx','LiquidSelection.tsx','RichText.tsx','FeaturedContent.tsx','featured-content.css']) files.set(`src/components/${name}`, `src/components/${name}`);
files.set('src/pages/TermReader.tsx', 'src/pages/TermReader.tsx');
for (const name of await readdir(resolve(root, 'src/components/spectral'))) if (!name.includes('.test.') && !name.includes('Lab')) files.set(`src/components/spectral/${name}`, `src/components/spectral/${name}`);
for (const name of await readdir(resolve(root, 'src/content-sdk'))) if (!name.includes('.test.')) files.set(`src/content-sdk/${name}`, `src/content-sdk/${name}`);
for (const path of ['src/hooks/useProgress.ts','src/infrastructure/progressRepository.ts','public/brand/ceptlens-original.png','public/brand/ceptlens-original.webp','public/brand/ceptlens-optic-hero.webp','THIRD_PARTY_NOTICES.md']) files.set(path, path);
for (const name of await readdir(resolve(root, 'public/spectral'))) if (/\.(webp|txt)$/.test(name)) files.set(`public/spectral/${name}`, `public/spectral/${name}`);
const hashes = {};
const stale = [];
const normalize = (bytes, name) => /\.(png|webp)$/.test(name) ? bytes : Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n'));
// Filesystem enumeration order differs on Windows and Linux. Keep release hashes deterministic.
for (const [source, destination] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
  const bytes = normalize(await readFile(resolve(root, source)), source);
  hashes[source] = createHash('sha256').update(bytes).digest('hex');
  const target = resolve(root, 'content-lab', destination);
  if (check) {
    const actual = await readFile(target).catch(() => null);
    if (!actual || !normalize(actual, destination).equals(bytes)) stale.push(destination);
  } else { await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes); }
}
const manifest = JSON.stringify({ format: 1, source: 'CeptLens platform presentation', files: hashes }, null, 2)+'\n';
const manifestPath = resolve(root, 'content-lab/platform-ui.json');
if (!check) await writeFile(manifestPath, manifest);
else if ((await readFile(manifestPath, 'utf8').catch(() => '')).replaceAll('\r\n','\n') !== manifest) stale.push('platform-ui.json');
if (stale.length) throw new Error(`Lab presentation is out of date. Run npm run ui:sync.\n${stale.join('\n')}`);
console.log(`${check ? 'Verified' : 'Synced'} ${files.size} platform presentation files for the standalone Content Lab.`);
