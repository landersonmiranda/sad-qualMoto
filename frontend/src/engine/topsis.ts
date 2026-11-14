import { Vehicle, UserUsageProfile, CriteriaWeights, TOPSISResultItem } from '../types';
import { calculateVehicleTCO } from './tco';

/**
 * MOTOR MULTICRITÉRIO TOPSIS
 * Technique for Order Preference by Similarity to Ideal Solution
 */
export function runTOPSIS(
  vehicles: Vehicle[],
  profile: UserUsageProfile,
  weights: CriteriaWeights
): TOPSISResultItem[] {
  if (vehicles.length === 0) return [];

  // 1. Calcular TCO de cada veículo para o perfil do decisor
  const itemsWithTCO = vehicles.map(v => ({
    vehicle: v,
    tco: calculateVehicleTCO(v, profile),
  }));

  // Normalização da soma dos pesos para 1.0 (100%)
  const totalWeight = weights.economy + weights.comfort + weights.performance + weights.reliability + weights.resale;
  const w = {
    economy: weights.economy / totalWeight,
    comfort: weights.comfort / totalWeight,
    performance: weights.performance / totalWeight,
    reliability: weights.reliability / totalWeight,
    resale: weights.resale / totalWeight
  };

  // 2. Extração dos vetores brutos da Matriz de Decisão
  // Critério de Economia: TCO (quanto MENOR, melhor = critério de CUSTO)
  // Conforto, Desempenho, Confiabilidade, Revenda: (quanto MAIOR, melhor = critérios de BENEFÍCIO)
  const economies = itemsWithTCO.map(item => item.tco.totalMonthlyTCO);
  const comforts = itemsWithTCO.map(item => item.vehicle.comfortScore);
  const performances = itemsWithTCO.map(item => item.vehicle.performanceScore);
  const reliabilities = itemsWithTCO.map(item => item.vehicle.reliabilityScore);
  const resales = itemsWithTCO.map(item => item.vehicle.resaleLiquidityScore);

  // Denominador vetorial euclidiano: sqrt(sum(x^2))
  const normEconomy = Math.sqrt(economies.reduce((sum, val) => sum + val * val, 0)) || 1;
  const normComfort = Math.sqrt(comforts.reduce((sum, val) => sum + val * val, 0)) || 1;
  const normPerformance = Math.sqrt(performances.reduce((sum, val) => sum + val * val, 0)) || 1;
  const normReliability = Math.sqrt(reliabilities.reduce((sum, val) => sum + val * val, 0)) || 1;
  const normResale = Math.sqrt(resales.reduce((sum, val) => sum + val * val, 0)) || 1;

  // 3. Matriz Ponderada Normalizada (V_ij = w_j * r_ij)
  const weightedMatrix = itemsWithTCO.map(item => {
    return {
      vehicleId: item.vehicle.id,
      economy: w.economy * (item.tco.totalMonthlyTCO / normEconomy),
      comfort: w.comfort * (item.vehicle.comfortScore / normComfort),
      performance: w.performance * (item.vehicle.performanceScore / normPerformance),
      reliability: w.reliability * (item.vehicle.reliabilityScore / normReliability),
      resale: w.resale * (item.vehicle.resaleLiquidityScore / normResale)
    };
  });

  // 4. Determinação dos Pontos Ideais Positivo (A+) e Negativo (A-)
  // NOTA CHAVE: Para Economia (TCO), como é custo, o Ideal Positivo é o MÍNIMO e o Negativo é o MÁXIMO!
  const idealPositive = {
    economy: Math.min(...weightedMatrix.map(m => m.economy)),
    comfort: Math.max(...weightedMatrix.map(m => m.comfort)),
    performance: Math.max(...weightedMatrix.map(m => m.performance)),
    reliability: Math.max(...weightedMatrix.map(m => m.reliability)),
    resale: Math.max(...weightedMatrix.map(m => m.resale))
  };

  const idealNegative = {
    economy: Math.max(...weightedMatrix.map(m => m.economy)),
    comfort: Math.min(...weightedMatrix.map(m => m.comfort)),
    performance: Math.min(...weightedMatrix.map(m => m.performance)),
    reliability: Math.min(...weightedMatrix.map(m => m.reliability)),
    resale: Math.min(...weightedMatrix.map(m => m.resale))
  };

  // 5. Cálculo das Distâncias Euclidianas (S_i+ e S_i-) e Coeficiente de Proximidade (C_i)
  const results = itemsWithTCO.map((item, idx) => {
    const v = weightedMatrix[idx];

    const distPos = Math.sqrt(
      Math.pow(v.economy - idealPositive.economy, 2) +
      Math.pow(v.comfort - idealPositive.comfort, 2) +
      Math.pow(v.performance - idealPositive.performance, 2) +
      Math.pow(v.reliability - idealPositive.reliability, 2) +
      Math.pow(v.resale - idealPositive.resale, 2)
    );

    const distNeg = Math.sqrt(
      Math.pow(v.economy - idealNegative.economy, 2) +
      Math.pow(v.comfort - idealNegative.comfort, 2) +
      Math.pow(v.performance - idealNegative.performance, 2) +
      Math.pow(v.reliability - idealNegative.reliability, 2) +
      Math.pow(v.resale - idealNegative.resale, 2)
    );

    // C_i: Coeficiente de Proximidade Relativa
    const denominator = distPos + distNeg;
    const closenessScore = denominator === 0 ? 0.5 : distNeg / denominator;

    // Status orçamentário
    let budgetStatus: 'within_budget' | 'budget_warning' | 'over_budget' = 'within_budget';
    if (item.tco.totalMonthlyTCO > profile.budgetLimitMonthly) {
      budgetStatus = 'over_budget';
    } else if (item.tco.totalMonthlyTCO > profile.budgetLimitMonthly * 0.9) {
      budgetStatus = 'budget_warning';
    }

    return {
      vehicle: item.vehicle,
      tco: item.tco,
      normalizedScores: {
        economy: Number((v.economy / (w.economy || 1)).toFixed(3)),
        comfort: Number((v.comfort / (w.comfort || 1)).toFixed(3)),
        performance: Number((v.performance / (w.performance || 1)).toFixed(3)),
        reliability: Number((v.reliability / (w.reliability || 1)).toFixed(3)),
        resale: Number((v.resale / (w.resale || 1)).toFixed(3))
      },
      distanceIdealPositive: Number(distPos.toFixed(4)),
      distanceIdealNegative: Number(distNeg.toFixed(4)),
      closenessScore: Number(closenessScore.toFixed(4)),
      rank: 0,
      budgetStatus
    };
  });

  // 6. Ordenar por ClosenessScore decrescente (Maior Ci vence!)
  results.sort((a, b) => b.closenessScore - a.closenessScore);

  // Atribuir ranking
  results.forEach((item, index) => {
    item.rank = index + 1;
  });

  return results;
}
