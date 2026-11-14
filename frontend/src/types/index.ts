export type MotoCategory = 'street' | 'trail' | 'scooter' | 'naked' | 'custom';

export interface Vehicle {
  id: string;
  fipeCode?: string;
  name: string;
  brand: string;
  category: MotoCategory;
  year: number;
  price: number; // Preço FIPE de aquisição (R$)
  monthlyFinancing: number; // Parcela média financiada (R$/mês)
  fipeDepreciationYearly: number; // % anual de desvalorização histórica
  cityKml: number; // Consumo cidade (km/l)
  highwayKml: number; // Consumo estrada (km/l)
  ipvaRate: number; // Alíquota IPVA para motos (ex: 0.02 = 2%)
  licensingAnnual: number; // Licenciamento / DPVAT anual (R$)
  insuranceAnnual: number; // Seguro médio anual (R$)
  maintenancePerKm: number; // Cesta de peças por km (óleo, relação/corrente, pastilhas, pneus)
  
  // Critérios Qualitativos (1 a 5)
  comfortScore: number; // Conforto e absorção de impactos (suspensão/banco)
  performanceScore: number; // Potência do motor e arrancada
  reliabilityScore: number; // Robustez mecânica e facilidade de peças
  resaleLiquidityScore: number; // Liquidez de revenda no mercado brasileiro
  
  badge?: string;
  fipeReferenceMonth?: string;
}

export interface UserUsageProfile {
  monthlyKm: number; // Quilometragem mensal estimada (ex: 1000 km)
  cityRatio: number; // % em perímetro urbano (ex: 0.8 = 80%)
  fuelPriceGasoline: number; // R$/litro gasolina
  fuelPriceEthanol: number; // R$/litro etanol
  budgetLimitMonthly: number; // Teto orçamentário mensal (parcela + custos operacionais)
  isFinanced: boolean;
  downPayment: number;
  preferredCategories?: MotoCategory[]; // Estilos de preferência filtrados na simulação
}

export interface CriteriaWeights {
  economy: number; // Peso para TCO e economia de combustível (%)
  comfort: number; // Peso para suspensão e conforto no trânsito (%)
  performance: number; // Peso para cilindrada e motor (%)
  reliability: number; // Peso para facilidade de peças e mecânica (%)
  resale: number; // Peso para facilidade de revenda FIPE (%)
}

export interface CalculatedTCO {
  vehicleId: string;
  monthlyFuelCost: number;
  monthlyFixedCost: number; // IPVA + Seguro + Licenciamento rateado
  monthlyMaintenanceCost: number; // Kit relação, pneus e óleo por km
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

export interface DecisionCluster {
  id: string;
  name: string; // Ex: "Campeãs de Eficiência & Baixo Custo"
  tagline: string;
  badge: string;
  icon: 'Zap' | 'Shield' | 'Flame' | 'Sparkles' | 'Award';
  description: string;
  idealForProfile: string;
  averageMonthlyTCO: number;
  averageCostPerKm: number;
  averageScoreCi: number;
  fitScore: number;
  isRecommended: boolean;
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
    budgetComplianceRate: number;
    bestCostPerKm: number;
    bestFuelEconomyKml: number;
  };
  sourceReference: {
    fipeReference: string;
    inmetroBase: string;
    lastUpdated: string;
  };
}

export type ActiveScreen = 'login' | 'dashboard' | 'simulation' | 'reports' | 'vehicles';
