// Read-only: verify Git ancestry, Pages deployment and the panel's static assets.
// Does not fetch/update refs, authenticate to Firebase, or mutate remote data.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gh = (...args) => JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8' }));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const origin = git('remote', 'get-url', 'origin');
const match = origin.match(/github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/);
if (!match) throw new Error('Expected a GitHub origin.');
const repository = match[1];
const pages = gh(`repos/${repository}/pages`);
const build = gh(`repos/${repository}/pages/builds/latest`);
if (build.status !== 'built' || !/^[a-f0-9]{40}$/.test(build.commit)) throw new Error('Successful Pages build not identified.');
const base = build.commit;
git('cat-file', '-e', base + '^{commit}');
const baseURL = new URL(pages.html_url);
async function download(relative) {
  const url = new URL(relative, baseURL);
  if (url.origin !== baseURL.origin) throw new Error('External resource excluded.');
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status}: ${url.pathname}`);
  return { bytes: Buffer.from(await response.arrayBuffer()), server: response.headers.get('server'), etag: response.headers.get('etag') };
}
const panel = await download('admin-firebase.html');
const html = panel.bytes.toString('utf8');
const paths = new Set(['admin-firebase.html']);
const external = [];
for (const found of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
  const url = new URL(found[1], new URL('admin-firebase.html', baseURL));
  if (!/\.(?:js|css)$/i.test(url.pathname)) continue;
  if (url.origin !== baseURL.origin) { external.push(url.href); continue; }
  paths.add(decodeURIComponent(url.pathname).replace(/^\//, ''));
}
const items = [...paths], files = [];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < items.length) {
    const path = items[next++];
    const remote = path === 'admin-firebase.html' ? panel : await download(path);
    const blob = execFileSync('git', ['show', base + ':' + path]);
    const normalized = value => value.toString('utf8').replaceAll('\r\n', '\n');
    files.push({ path, byteExact: remote.bytes.equals(blob), textLfExact: normalized(remote.bytes) === normalized(blob), sha256Served: hash(remote.bytes), sha256GitBlob: hash(blob), server: remote.server, etag: remote.etag });
  }
}));
files.sort((a, b) => a.path.localeCompare(b.path));
const report = { verifiedAt: new Date().toISOString(), repository, origin, pages: { url: pages.html_url, source: pages.source, buildStatus: build.status, commit: base, updatedAt: build.updated_at }, git: { head: git('rev-parse', 'HEAD'), originMain: git('rev-parse', 'origin/main'), remoteMain: git('ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0], headVsProduction: git('rev-list', '--left-right', '--count', 'HEAD...' + base) }, files, externalSdkResources: external, allPanelAssetsMatch: files.every(f => f.textLfExact), limitations: ['Static panel and directly referenced repository JS/CSS only.', 'Does not establish the version of deployed Firebase Rules, functions, or database records.'], productionOperationalFirebaseReads: 0, productionWrites: 0 };
const outputArg = process.argv.indexOf('--output');
if (outputArg !== -1 && !process.argv[outputArg + 1]) throw new Error('Missing --output path.');
const destination = outputArg === -1 ? '.codex/production-baseline.json' : process.argv[outputArg + 1];
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ commit: base, files: files.length, byteExact: files.filter(f => f.byteExact).length, textLfExact: files.filter(f => f.textLfExact).length, mismatches: files.filter(f => !f.textLfExact).map(f => f.path), remoteMain: report.git.remoteMain, productionWrites: 0 }));
if (!report.allPanelAssetsMatch || report.git.remoteMain !== base) process.exitCode = 1;
