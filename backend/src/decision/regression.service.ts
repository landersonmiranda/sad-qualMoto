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

    // Fatores de ciclo de vida de motocicletas (progressão técnica e empírica):
    // Ano 1 (garantia total de fábrica): 0.55x do custo base (apenas revisões programadas de óleo e filtro)
    // Ano 2 (garantia): 0.80x do custo base (revisões intermediárias, pastilhas e fluidos)
    // Ano 3 (fim de garantia): 1.25x do custo base (1ª troca de kit relação, pneus, velas, bateria) -> Ponto de inflexão
    // Ano 4 (pós-garantia): 1.70x do custo base (segundo par de pneus, cabos, buchas, preventiva completa)
    // Ano 5+ (risco corretivo): 2.25x do custo base (embreagem, estator, amortecedores, rolamentos)
    const lifecycleAgingFactors = [0.55, 0.80, 1.25, 1.70, 2.25];

    for (let t = 1; t <= 5; t++) {
      const accumulatedKm = annualKm * t;

      // Regressão Exponencial de Depreciação FIPE: V(t) = V0 * (1 - dep)^t
      const residualFipeValue = Math.round(initialPrice * Math.pow(1 - depRate, t));
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

