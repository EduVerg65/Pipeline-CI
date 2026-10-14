'use strict';

/**
 * Regras de negócio de um pedido simples.
 * Serve apenas de "carga útil" para o pipeline: algo que precisa
 * ser testado, empacotado e rastreado até o commit.
 */

function validarItem(item) {
  if (!item || typeof item !== 'object') {
    throw new TypeError('Item inválido');
  }
  if (typeof item.preco !== 'number' || item.preco < 0 || !Number.isFinite(item.preco)) {
    throw new RangeError('Preço deve ser um número >= 0');
  }
  if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
    throw new RangeError('Quantidade deve ser um inteiro > 0');
  }
}

/** Arredonda para centavos evitando erros de ponto flutuante. */
function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function calcularSubtotal(itens) {
  if (!Array.isArray(itens)) {
    throw new TypeError('Itens deve ser uma lista');
  }
  const total = itens.reduce((soma, item) => {
    validarItem(item);
    return soma + item.preco * item.quantidade;
  }, 0);
  return arredondar(total);
}

/** Aplica desconto percentual (0 a 100). */
function aplicarDesconto(valor, percentual) {
  if (typeof percentual !== 'number' || percentual < 0 || percentual > 100) {
    throw new RangeError('Desconto deve estar entre 0 e 100');
  }
  return arredondar(valor * (1 - percentual / 100));
}

/** Frete grátis a partir de R$ 200,00; caso contrário, taxa fixa. */
function calcularFrete(subtotal, { limiteGratis = 200, taxa = 19.9 } = {}) {
  return subtotal >= limiteGratis ? 0 : taxa;
}

function calcularTotal(itens, { desconto = 0 } = {}) {
  const subtotal = calcularSubtotal(itens);
  const comDesconto = aplicarDesconto(subtotal, desconto);
  const frete = calcularFrete(comDesconto);
  return {
    subtotal,
    desconto: arredondar(subtotal - comDesconto),
    frete,
    total: arredondar(comDesconto + frete),
  };
}

module.exports = {
  arredondar,
  calcularSubtotal,
  aplicarDesconto,
  calcularFrete,
  calcularTotal,
};
