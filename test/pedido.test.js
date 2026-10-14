'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  arredondar,
  calcularSubtotal,
  aplicarDesconto,
  calcularFrete,
  calcularTotal,
} = require('../src/pedido');

describe('arredondar', () => {
  it('arredonda para duas casas', () => {
    assert.equal(arredondar(0.1 + 0.2), 0.3);
    assert.equal(arredondar(10.005), 10.01);
  });
});

describe('calcularSubtotal', () => {
  it('soma preço x quantidade', () => {
    const itens = [
      { preco: 10, quantidade: 2 },
      { preco: 5.5, quantidade: 3 },
    ];
    assert.equal(calcularSubtotal(itens), 36.5);
  });

  it('lista vazia resulta em zero', () => {
    assert.equal(calcularSubtotal([]), 0);
  });

  it('rejeita quantidade inválida', () => {
    assert.throws(() => calcularSubtotal([{ preco: 10, quantidade: 0 }]), RangeError);
    assert.throws(() => calcularSubtotal([{ preco: 10, quantidade: 1.5 }]), RangeError);
  });

  it('rejeita preço negativo', () => {
    assert.throws(() => calcularSubtotal([{ preco: -1, quantidade: 1 }]), RangeError);
  });

  it('rejeita entrada que não é lista', () => {
    assert.throws(() => calcularSubtotal(null), TypeError);
  });
});

describe('aplicarDesconto', () => {
  it('aplica percentual', () => {
    assert.equal(aplicarDesconto(100, 10), 90);
  });

  it('rejeita desconto fora de 0..100', () => {
    assert.throws(() => aplicarDesconto(100, -5), RangeError);
    assert.throws(() => aplicarDesconto(100, 150), RangeError);
  });
});

describe('calcularFrete', () => {
  it('cobra frete abaixo do limite', () => {
    assert.equal(calcularFrete(199.99), 19.9);
  });

  it('frete grátis a partir do limite', () => {
    assert.equal(calcularFrete(200), 0);
  });
});

describe('calcularTotal', () => {
  it('combina subtotal, desconto e frete', () => {
    const itens = [
      { preco: 39.9, quantidade: 2 },
      { preco: 59.9, quantidade: 1 },
    ];
    assert.deepEqual(calcularTotal(itens, { desconto: 10 }), {
      subtotal: 139.7,
      desconto: 13.97,
      frete: 19.9,
      total: 145.63,
    });
  });

  it('pedido grande ganha frete grátis', () => {
    const r = calcularTotal([{ preco: 250, quantidade: 1 }]);
    assert.equal(r.frete, 0);
    assert.equal(r.total, 250);
  });
});
