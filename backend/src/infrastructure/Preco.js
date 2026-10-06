/**
 * Preço de aluguel — fonte única de verdade no backend.
 * Espelha exatamente a fórmula já usada pelo CarrContext do frontend
 * (valor mensal / 28 x fator de permanência), mas o recálculo do pedido
 * SEMPRE acontece aqui: o valor enviado pelo cliente nunca é aceito (§17/§52).
 */

export const MIN_RENTAL_DAYS = 7;
export const MAX_RENTAL_DAYS = 365;

export const calcDailyRate = (valorMensal, dias) => {
  const base = Number(valorMensal) || 0;
  const baseDiario = base / 28;
  let fator;
  if (dias <= 14) fator = 1.25;
  else if (dias <= 30) fator = 1.10;
  else if (dias <= 90) fator = 1.00;
  else fator = 0.92;
  return baseDiario * fator;
};

export const calcRentalTotal = (valorMensal, dias) => calcDailyRate(valorMensal, dias) * dias;

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
