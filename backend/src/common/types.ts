export type MotoCategory = 'street' | 'trail' | 'scooter' | 'naked' | 'custom';

export interface Vehicle {
  id: string;
  fipeCode?: string;
  name: string;
  brand: string;
  category: MotoCategory;
  year: number;
  price: number; // Preço FIPE oficial de aquisição (R$)
  monthlyFinancing: number; // Parcela média financiada (R$/mês)
  fipeDepreciationYearly: number; // % anual de desvalorização histórica FIPE
  cityKml: number; // Consumo cidade homologado Inmetro (km/l)
  highwayKml: number; // Consumo estrada homologado Inmetro (km/l)
  ipvaRate: number; // Alíquota IPVA estadual para motos (ex: 0.02 = 2%)
  licensingAnnual: number; // Licenciamento / DPVAT anual (R$)
  insuranceAnnual: number; // Seguro médio anual (R$)
  maintenancePerKm: number; // Cesta de peças por km (óleo, relação, pastilhas, pneus)
  
  // Critérios Qualitativos de Engenharia (1 a 5)
  comfortScore: number; // Conforto e absorção de impactos (suspensão/banco)
  performanceScore: number; // Potência do motor e aceleração
  reliabilityScore: number; // Robustez mecânica e disponibilidade de peças
  resaleLiquidityScore: number; // Liquidez de revenda no mercado brasileiro
  
  badge?: string;
  fipeReferenceMonth?: string;
}

export interface UserUsageProfile {
  monthlyKm: number; // Quilometragem mensal estimada (ex: 1000 km)
  cityRatio: number; // % em perímetro urbano (ex: 0.8 = 80%)
  fuelPriceGasoline: number; // R$/litro gasolina
  fuelPriceEthanol: number; // R$/litro etanol
  budgetLimitMonthly: number; // Teto orçamentário mensal
  isFinanced: boolean;
  downPayment: number;
  preferredCategories?: MotoCategory[]; // Estilos de preferência filtrados na simulação
}

export interface CriteriaWeights {
  economy: number; // Peso para TCO e economia de combustível (%)
  comfort: number; // Peso para suspensão e conforto (%)
  performance: number; // Peso para motor e aceleração (%)
  reliability: number; // Peso para mecânica e peças (%)
  resale: number; // Peso para liquidez e revenda FIPE (%)
}

export interface CalculatedTCO {
  vehicleId: string;
  monthlyFuelCost: number;
  monthlyFixedCost: number; // IPVA + Seguro + Licenciamento rateado
  monthlyMaintenanceCost: number; // Cesta de peças por km
  monthlyDepreciationCost: number;
  monthlyCapitalOrFinancing: number;
  totalMonthlyTCO: number;
  totalAnnualTCO: number;
  costPerKm: number; // R$/km rodado
}

export interface TOPSISResultItem {
  vehicle: Vehicle;
  tco: CalculatedTCO;
  normalizedScores: {
    economy: number;
    comfort: number;
    performance: number;
    reliability: number;
    resale: number;
  };
  distanceIdealPositive: number;
  distanceIdealNegative: number;
  closenessScore: number;
  rank: number;
  budgetStatus: 'within_budget' | 'budget_warning' | 'over_budget';
}

/**
 * CLUSTER DE DECISÃO ESTRATÉGICA BATIZADO
 */
export interface DecisionCluster {
  id: string;
  name: string; // Ex: "Campeãs de Eficiência & Baixo Custo"
  tagline: string; // Ex: "Mínimo custo por km rodado e manutenção acessível"
  badge: string;
  icon: 'Zap' | 'Shield' | 'Flame' | 'Sparkles' | 'Award';
  description: string;
  idealForProfile: string;
  averageMonthlyTCO: number;
  averageCostPerKm: number;
  averageScoreCi: number;
  fitScore: number; // % de adequação ao perfil (0 a 100%)
  isRecommended: boolean; // Grupo vencedor para este perfil
  pros: string[];
  cons: string[];
  vehicles: TOPSISResultItem[];
}

export interface LifecycleYearProjection {
  year: number;
  accumulatedKm: number;
  residualFipeValue: number;
  annualDepreciationLoss: number;
  annualMaintenanceCost: number;
  annualFuelCost: number;
  annualFixedCost: number;
  annualTotalTCO: number;
  costPerKmInYear: number;
  recommendation: 'Manter com Segurança' | 'Janela Ideal de Substituição' | 'Risco Elevado de Corretiva';
}

export interface LifecycleRegressionAnalysis {
  vehicleId: string;
  vehicleName: string;
  optimalReplacementYear: number;
  optimalReplacementMonth: number;
  projections: LifecycleYearProjection[];
  executiveSummary: string;
}

export interface SimulationResponse {
  clusters: DecisionCluster[];
  recommendedCluster: DecisionCluster;
  totalVehiclesAnalyzed: number;
  regressionAnalysis?: LifecycleRegressionAnalysis;
  decisionSummary: {
    headline: string;
    justification: string;
    budgetComplianceRate: number; // % dentro do teto
    bestCostPerKm: number;
    bestFuelEconomyKml: number;
  };
  sourceReference: {
    fipeReference: string;
    inmetroBase: string;
    lastUpdated: string;
  };
}

