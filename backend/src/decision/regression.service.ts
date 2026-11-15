import { Injectable } from '@nestjs/common';
import { Vehicle, UserUsageProfile } from '../common/types';

export interface LifecycleYearProjection {
  year: number;
  accumulatedKm: number;
  residualFipeValue: number; // V(t) = V0 * (1 - dep)^t
  annualDepreciationLoss: number;
  annualMaintenanceCost: number; // Crescimento progressivo por desgaste
  annualFuelCost: number;
  annualFixedCost: number;
  annualTotalTCO: number;
  costPerKmInYear: number;
  recommendation: 'Manter com Segurança' | 'Janela Ideal de Substituição' | 'Risco Elevado de Corretiva';
}

export interface LifecycleRegressionAnalysis {
  vehicleId: string;
  vehicleName: string;
  optimalReplacementYear: number; // Ponto de inflexão ótimo
  optimalReplacementMonth: number;
  projections: LifecycleYearProjection[];
  executiveSummary: string;
}

@Injectable()
export class RegressionService {
  /**
   * FUNÇÃO ANALÍTICA: REGRESSÃO TEMPORAL DE CICLO DE VIDA (MANTER VS. TROCAR)
   * 
   * Entrada: Dados técnicos do veículo (preço FIPE, taxa depreciação, custo peças/km) e Perfil de uso (km/mês).
   * Processamento: Regressão exponencial de valor residual decrescente combinada com projeção
   *                não-linear de custos de manutenção por envelhecimento mecânico.
   * Resultado Decisório: Curva de custo de ciclo de vida e determinação do Ponto Ótimo de Substituição.
   */
  calculateReplacementCurve(vehicle: Vehicle, profile: UserUsageProfile): LifecycleRegressionAnalysis {
    const annualKm = profile.monthlyKm * 12;
    const initialPrice = vehicle.price;
    const depRate = vehicle.fipeDepreciationYearly;

    // Consumo harmônico e combustível anual
    const cityWeight = profile.cityRatio;
    const highwayWeight = 1 - profile.cityRatio;
    const harmonicKml = 1 / ((cityWeight / vehicle.cityKml) + (highwayWeight / vehicle.highwayKml));
    const annualFuel = (annualKm / harmonicKml) * profile.fuelPriceGasoline;
    const annualFixed = (vehicle.price * vehicle.ipvaRate) + vehicle.insuranceAnnual + vehicle.licensingAnnual;

    const projections: LifecycleYearProjection[] = [];
    let prevValue = initialPrice;
    let optimalYear = 3;
    let foundCrossover = false;

    // Ponderadores de desvalorização anual real (maior impacto ao sair da concessionária no Ano 1)
    const annualDepreciationWeights = [2.2, 1.4, 1.0, 0.75, 0.60];

    // Fatores de envelhecimento mecânico:
    // Ano 1 (garantia total de fábrica de 3 anos, mão de obra grátis nas primeiras revisões): 0.30x
    // Ano 2 (garantia ativa, 1º kit relação e pneus): 0.65x
    // Ano 3 (fim de garantia, peças pesadas de desgaste, bateria, velas): 1.10x
    // Ano 4 (pós-garantia, preventiva geral): 1.55x
    // Ano 5+ (risco corretivo severo): 2.05x
    const lifecycleAgingFactors = [0.30, 0.65, 1.10, 1.55, 2.05];

    for (let t = 1; t <= 5; t++) {
      const accumulatedKm = annualKm * t;

      const yearDepRate = Math.min(0.25, depRate * (annualDepreciationWeights[t - 1] || 0.7));
      const residualFipeValue = Math.round(prevValue * (1 - yearDepRate));
      const annualDepreciationLoss = prevValue - residualFipeValue;
      prevValue = residualFipeValue;

      const agingFactor = lifecycleAgingFactors[t - 1] || (1 + (t - 1) * 0.25);
      const annualMaintenanceCost = Math.round(annualKm * vehicle.maintenancePerKm * agingFactor);

      const annualTotalTCO = Math.round(annualFuel + annualFixed + annualMaintenanceCost + annualDepreciationLoss);
      const costPerKmInYear = Number((annualTotalTCO / annualKm).toFixed(2));

      if (!foundCrossover && annualMaintenanceCost > annualDepreciationLoss) {
        optimalYear = t;
        foundCrossover = true;
      }

      // Determinação do status decisório
      let recommendation: 'Manter com Segurança' | 'Janela Ideal de Substituição' | 'Risco Elevado de Corretiva' = 'Manter com Segurança';
      if (!foundCrossover) {
        recommendation = 'Manter com Segurança';
      } else if (t < optimalYear) {
        recommendation = 'Manter com Segurança';
      } else if (t === optimalYear || t === optimalYear + 1) {
        recommendation = 'Janela Ideal de Substituição';
      } else {
        recommendation = 'Risco Elevado de Corretiva';
      }

      projections.push({
        year: t,
        accumulatedKm,
        residualFipeValue,
        annualDepreciationLoss,
        annualMaintenanceCost,
        annualFuelCost: Math.round(annualFuel),
        annualFixedCost: Math.round(annualFixed),
        annualTotalTCO,
        costPerKmInYear,
        recommendation
      });
    }

    const executiveSummary = foundCrossover
      ? `A análise de regressão temporal indica que o ponto ótimo de substituição (Manter vs. Trocar) ocorre no Ano ${optimalYear} (~${optimalYear * 12} meses ou ~${(annualKm * optimalYear).toLocaleString('pt-BR')} km). A partir deste ponto, o custo de manutenção preventiva/corretiva supera a perda por desvalorização FIPE, tornando a substituição economicamente superior à retenção do ativo.`
      : `Com baixa rodagem projetada (~${annualKm.toLocaleString('pt-BR')} km/ano), o custo de manutenção preventiva permanece inferior à desvalorização FIPE em todo o ciclo de 5 anos, indicando retenção vantajosa além de 60 meses com baixo risco corretivo.`;

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      optimalReplacementYear: optimalYear,
      optimalReplacementMonth: optimalYear * 12,
      projections,
      executiveSummary
    };
  }
}

