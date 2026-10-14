'use strict';

/**
 * Build: copia o código-fonte para dist/ e grava dist/build-info.json,
 * que liga o artefato ao commit e à execução do pipeline que o gerou.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const raiz = path.join(__dirname, '..');
const dist = path.join(raiz, 'dist');
const pkg = require(path.join(raiz, 'package.json'));

function commitAtual() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync('git rev-parse HEAD', { cwd: raiz, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'desconhecido';
  }
}

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(raiz, 'src'), dist, { recursive: true });

const commit = commitAtual();
const info = {
  name: pkg.name,
  version: pkg.version,
  commit,
  commitCurto: commit.slice(0, 7),
  branch: process.env.GITHUB_REF_NAME || 'local',
  evento: process.env.GITHUB_EVENT_NAME || 'local',
  buildId: process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || 1}`
    : 'local',
  repositorio: process.env.GITHUB_REPOSITORY || 'local',
  node: process.version,
  geradoEm: new Date().toISOString(),
};

fs.writeFileSync(path.join(dist, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');
console.log('Build concluído em dist/');
console.log(JSON.stringify(info, null, 2));
