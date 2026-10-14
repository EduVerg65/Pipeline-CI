'use strict';

/**
 * Empacota dist/ em artifacts/<nome>-<versão>-<commit7>.tar.gz
 * e grava o checksum SHA-256 ao lado. O nome do arquivo já identifica
 * de qual versão e de qual commit o artefato veio.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const raiz = path.join(__dirname, '..');
const dist = path.join(raiz, 'dist');
const saida = path.join(raiz, 'artifacts');

if (!fs.existsSync(path.join(dist, 'build-info.json'))) {
  console.error('dist/ não encontrado. Rode "npm run build" antes.');
  process.exit(1);
}

const info = JSON.parse(fs.readFileSync(path.join(dist, 'build-info.json'), 'utf8'));
const nome = `${info.name}-${info.version}-${info.commitCurto}.tar.gz`;

fs.mkdirSync(saida, { recursive: true });
const arquivo = path.join(saida, nome);

// --sort/--mtime/--owner deixam o tar estável entre execuções.
execFileSync('tar', [
  '--sort=name',
  '--owner=0',
  '--group=0',
  '--numeric-owner',
  '-czf',
  arquivo,
  '-C',
  dist,
  '.',
]);

const hash = crypto.createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');
fs.writeFileSync(`${arquivo}.sha256`, `${hash}  ${nome}\n`);

console.log(`Artefato: artifacts/${nome}`);
console.log(`SHA-256:  ${hash}`);

// Exporta o nome para os próximos passos do GitHub Actions.
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `nome=${nome}\nsha256=${hash}\n`);
}
