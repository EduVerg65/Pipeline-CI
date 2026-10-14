#!/usr/bin/env bash
# Reproduz localmente as mesmas etapas do pipeline, na mesma ordem.
# Uso:  ./scripts/ci-local.sh            (execução normal)
#       SIMULAR_FALHA=true ./scripts/ci-local.sh   (demonstra a interrupção)
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== 1. Ambiente limpo =="
rm -rf node_modules
npm run clean

echo "== 2. Dependências (npm ci, a partir do package-lock.json) =="
npm ci

echo "== 3. Testes =="
mkdir -p reports
npm run test:ci

echo "== 4. Build =="
npm run build

echo "== 5. Artefato =="
npm run package

echo "== Pipeline local concluído com sucesso =="
