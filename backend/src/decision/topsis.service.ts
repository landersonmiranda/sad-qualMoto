import { Injectable } from '@nestjs/common';
import { Vehicle, UserUsageProfile, CriteriaWeights, TOPSISResultItem } from '../common/types';
import { TcoService } from './tco.service';

@Injectable()
export class TopsisService {
  constructor(private readonly tcoService: TcoService) {}

  run(vehicles: Vehicle[], profile: UserUsageProfile, weights: CriteriaWeights): TOPSISResultItem[] {
    if (!vehicles || vehicles.length === 0) return [];

    // 1. TCO para cada veículo
    const items = vehicles.map(v => ({
      vehicle: v,
      tco: this.tcoService.calculate(v, profile),
    }));

    // Normalização dos pesos para soma 1.0
    const totalWeight = weights.economy + weights.comfort + weights.performance + weights.reliability + weights.resale;
    const w = {
      economy: weights.economy / totalWeight,
      comfort: weights.comfort / totalWeight,
      performance: weights.performance / totalWeight,
      reliability: weights.reliability / totalWeight,
      resale: weights.resale / totalWeight,
    };

    // 2. Vetores da Matriz de Decisão
    const economies = items.map(i => i.tco.totalMonthlyTCO);
    const comforts = items.map(i => i.vehicle.comfortScore);
    const performances = items.map(i => i.vehicle.performanceScore);
    const reliabilities = items.map(i => i.vehicle.reliabilityScore);
    const resales = items.map(i => i.vehicle.resaleLiquidityScore);

    // Denominadores Euclidianos
    const normEconomy = Math.sqrt(economies.reduce((s, v) => s + v * v, 0)) || 1;
    const normComfort = Math.sqrt(comforts.reduce((s, v) => s + v * v, 0)) || 1;
    const normPerformance = Math.sqrt(performances.reduce((s, v) => s + v * v, 0)) || 1;
    const normReliability = Math.sqrt(reliabilities.reduce((s, v) => s + v * v, 0)) || 1;
    const normResale = Math.sqrt(resales.reduce((s, v) => s + v * v, 0)) || 1;

    // 3. Matriz Ponderada
    const weighted = items.map(item => ({
      vehicleId: item.vehicle.id,
      economy: w.economy * (item.tco.totalMonthlyTCO / normEconomy),
      comfort: w.comfort * (item.vehicle.comfortScore / normComfort),
      performance: w.performance * (item.vehicle.performanceScore / normPerformance),
      reliability: w.reliability * (item.vehicle.reliabilityScore / normReliability),
      resale: w.resale * (item.vehicle.resaleLiquidityScore / normResale),
    }));

    // 4. Ideais Positivo (A+) e Negativo (A-)
    // Custo (TCO): menor é melhor -> A+ é min, A- é max
    // Benefícios (demais): maior é melhor -> A+ é max, A- é min
    const idealPositive = {
      economy: Math.min(...weighted.map(x => x.economy)),
      comfort: Math.max(...weighted.map(x => x.comfort)),
      performance: Math.max(...weighted.map(x => x.performance)),
      reliability: Math.max(...weighted.map(x => x.reliability)),
      resale: Math.max(...weighted.map(x => x.resale)),
    };

    const idealNegative = {
      economy: Math.max(...weighted.map(x => x.economy)),
      comfort: Math.min(...weighted.map(x => x.comfort)),
      performance: Math.min(...weighted.map(x => x.performance)),
      reliability: Math.min(...weighted.map(x => x.reliability)),
      resale: Math.min(...weighted.map(x => x.resale)),
    };

    // 5. Distâncias Euclidianas e Coeficiente de Proximidade (Ci)
    const results = items.map((item, idx) => {
      const row = weighted[idx];
      const dPos = Math.sqrt(
        Math.pow(row.economy - idealPositive.economy, 2) +
        Math.pow(row.comfort - idealPositive.comfort, 2) +
        Math.pow(row.performance - idealPositive.performance, 2) +
        Math.pow(row.reliability - idealPositive.reliability, 2) +
        Math.pow(row.resale - idealPositive.resale, 2)
      );

      const dNeg = Math.sqrt(
        Math.pow(row.economy - idealNegative.economy, 2) +
        Math.pow(row.comfort - idealNegative.comfort, 2) +
        Math.pow(row.performance - idealNegative.performance, 2) +
        Math.pow(row.reliability - idealNegative.reliability, 2) +
        Math.pow(row.resale - idealNegative.resale, 2)
      );

      const closenessScore = dPos + dNeg === 0 ? 0 : dNeg / (dPos + dNeg);

      // Status do teto orçamentário
      let budgetStatus: 'within_budget' | 'budget_warning' | 'over_budget' = 'within_budget';
      if (item.tco.totalMonthlyTCO > profile.budgetLimitMonthly * 1.15) {
        budgetStatus = 'over_budget';
      } else if (item.tco.totalMonthlyTCO > profile.budgetLimitMonthly) {
        budgetStatus = 'budget_warning';
      }

      return {
        vehicle: item.vehicle,
        tco: item.tco,
        normalizedScores: {
          economy: row.economy,
          comfort: row.comfort,
          performance: row.performance,
          reliability: row.reliability,
          resale: row.resale,
        },
        distanceIdealPositive: dPos,
        distanceIdealNegative: dNeg,
        closenessScore,
        rank: 0,
        budgetStatus,
      };
    });

    // Ordenação decrescente de Ci
    results.sort((a, b) => b.closenessScore - a.closenessScore);
    results.forEach((item, index) => {
      item.rank = index + 1;
    });

    return results;
  }
}

