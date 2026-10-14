'use strict';

/**
 * Teste usado APENAS para demonstrar que o pipeline detecta falhas.
 *
 * Em execuções normais ele passa. Quando o pipeline é disparado
 * manualmente com a opção "simular_falha = true", a variável de
 * ambiente SIMULAR_FALHA fica "true" e este teste falha de propósito.
 * O pipeline deve então parar ANTES de gerar o artefato.
 */

const { it } = require('node:test');
const assert = require('node:assert/strict');

it('falha controlada (desligada por padrão)', () => {
  const simular = process.env.SIMULAR_FALHA === 'true';
  assert.equal(
    simular,
    false,
    'Falha simulada solicitada (SIMULAR_FALHA=true) — o pipeline deve ser interrompido aqui'
  );
});
