const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export const formatCompactBRL = (value: number) => compactCurrency.format(value);
export const formatDecimal = (value: number) => decimal.format(value);
export const formatInteger = (value: number) => integer.format(value);
