'use strict';

// Remove saídas de builds anteriores para garantir que o build parta do zero.
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
for (const pasta of ['dist', 'reports', 'artifacts']) {
  fs.rmSync(path.join(raiz, pasta), { recursive: true, force: true });
  console.log(`removido: ${pasta}/`);
}
