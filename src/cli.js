#!/usr/bin/env node
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { calcularTotal } = require('./pedido');

// Quando executado a partir do artefato (dist/), mostra de qual commit ele veio.
const infoPath = path.join(__dirname, 'build-info.json');
if (fs.existsSync(infoPath)) {
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  console.log(`Versão ${info.version} | commit ${info.commit} | build ${info.buildId}`);
}

const exemplo = [
  { nome: 'Caneca personalizada', preco: 39.9, quantidade: 2 },
  { nome: 'Camiseta', preco: 59.9, quantidade: 1 },
];

console.log(JSON.stringify(calcularTotal(exemplo, { desconto: 10 }), null, 2));
