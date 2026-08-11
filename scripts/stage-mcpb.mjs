import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stage = resolve(root, '.mcpb-build');

rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

for (const path of ['build', 'package.json', 'bun.lock', 'README.md', 'LICENSE', 'SECURITY.md']) {
  cpSync(resolve(root, path), resolve(stage, path), { recursive: true });
}

cpSync(resolve(root, 'mcpb/manifest.json'), resolve(stage, 'manifest.json'));
cpSync(resolve(root, 'mcpb/icon.png'), resolve(stage, 'icon.png'));

const install = spawnSync(
  'bun',
  ['install', '--frozen-lockfile', '--production', '--ignore-scripts'],
  { cwd: stage, stdio: 'inherit' }
);

if (install.status !== 0) {
  process.exit(install.status ?? 1);
}
