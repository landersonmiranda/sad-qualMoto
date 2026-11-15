import { 
  UserUsageProfile, 
  CriteriaWeights, 
  Vehicle, 
  SimulationResponse,
  DecisionCluster,
  TOPSISResultItem
} from '../types';
import { runTOPSIS } from '../engine/topsis';

const BACKEND_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Busca a base oficial de motocicletas da FIPE diretamente do Back-End NestJS
 */
export async function fetchVehiclesFromBackend(): Promise<Vehicle[] | null> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/decision/vehicles`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    // Backend offline ou iniciando
  }
  return null;
}

/**
 * Consulta a Simulação e Clusterização Estratégica no Backend NestJS
 */
export async function simulateDecision(
  profile: UserUsageProfile,
  weights: CriteriaWeights,
  vehicles: Vehicle[]
): Promise<{ data: SimulationResponse; isFromBackend: boolean }> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/decision/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile,
        weights,
        vehicles,
      }),
    });

    if (res.ok) {
      const data: SimulationResponse = await res.json();
      return { data, isFromBackend: true };
    }
  } catch (err) {
    console.info('Backend NestJS em http://localhost:3001 offline. Executando motor de clusterização em modo resiliente local.');
  }

  // Fallback analítico local com idêntica lógica de agrupamento
  return { 
    data: simulateDecisionSync(vehicles, profile, weights), 
    isFromBackend: false 
  };
}

/**
 * Agrupamento de Grupos Batizados Local (Garante funcionamento mesmo se o backend estiver em inicialização)
 */
export function simulateDecisionSync(
  vehicles: Vehicle[],
  profile: UserUsageProfile,
  weights: CriteriaWeights
): SimulationResponse {
  // Filtra por estilos/categorias preferidos se selecionados pelo usuário
  const filteredVehicles = (profile.preferredCategories && profile.preferredCategories.length > 0)
    ? vehicles.filter(v => profile.preferredCategories!.includes(v.category))
    : vehicles;
  const vehiclesToUse = filteredVehicles.length > 0 ? filteredVehicles : vehicles;

  const topsisItems = runTOPSIS(vehiclesToUse, profile, weights);

  const clusterDefs: Record<string, {
    name: string;
    tagline: string;
    badge: string;
    icon: 'Zap' | 'Shield' | 'Flame' | 'Sparkles' | 'Award';
    description: string;
    idealForProfile: string;
    pros: string[];
    cons: string[];
    matcher: (item: TOPSISResultItem) => boolean;
  }> = {
    efficiency_kings: {
      name: 'Econômicas & Baixo Custo',
      tagline: 'Menor custo por quilômetro rodado e manutenção preventiva acessível',
      badge: 'Custo Mínimo / km',
      icon: 'Zap',
      description: 'Motos com foco em baixo consumo e manutenção barata. Autonomia elevada (acima de 42 km/l ou elétricas), com pneus e peças de reposição acessíveis.',
      idealForProfile: 'Uso diário urbano intenso com foco em economia e menor gasto mensal possível.',
      pros: [
        'Menor custo por km rodado do mercado',
        'Consumo de combustível reduzido (até 49 km/l)',
        'IPVA e seguro com valores menores'
      ],
      cons: [
        'Desempenho modesto para ultrapassagens em rodovia',
        'Acabamento e painel mais simples'
      ],
      matcher: (item) => {
        const cat = item.vehicle.category;
        const kml = item.vehicle.cityKml;
        const price = item.vehicle.price;
        return (cat === 'scooter' && price < 17000) || kml >= 42 || price < 16000;
      }
    },
    rugged_utility: {
      name: 'Uso Misto & Trail',
      tagline: 'Suspensão de curso longo para asfalto irregular e vias com buracos',
      badge: 'Alta Resistência',
      icon: 'Shield',
      description: 'Motos trail com suspensão de curso longo (180mm a 220mm), posição de pilotagem ereta e boa capacidade de absorção de impactos.',
      idealForProfile: 'Trajetos com asfalto irregular, lombadas, valetas ou trechos de estrada de terra.',
      pros: [
        'Boa absorção de impactos e conforto em vias esburacadas',
        'Menor risco de danos em rodas e suspensão',
        'Posição de pilotagem mais alta e ereta'
      ],
      cons: [
        'Preço de compra ligeiramente superior às motos street equivalentes',
        'Assento mais alto pode exigir mais adaptação'
      ],
      matcher: (item) => item.vehicle.category === 'trail'
    },
    resale_liquidity: {
      name: 'Alta Liquidez & Revenda',
      tagline: 'Modelos tradicionais com menor desvalorização e grande procura no mercado',
      badge: 'Facilidade de Revenda',
      icon: 'Award',
      description: 'Motos de grande volume no mercado brasileiro, com ampla oferta de peças de reposição e facilidade na hora da revenda.',
      idealForProfile: 'Quem prioriza segurança na revenda futura e rapidez para encontrar peças e mecânicos.',
      pros: [
        'Baixa desvalorização anual na Tabela FIPE',
        'Peças de reposição disponíveis em praticamente qualquer oficina',
        'Facilidade e rapidez para revender'
      ],
      cons: [
        'Maior índice de visibilidade para seguro',
        'Suspensão com curso convencional para uso urbano'
      ],
      matcher: (item) => item.vehicle.category === 'street' && item.vehicle.price >= 16000 && item.vehicle.resaleLiquidityScore >= 4.5
    },
    urban_comfort: {
      name: 'Conforto & Scooters',
      tagline: 'Câmbio automático CVT, compartimento sob o banco e facilidade no trânsito',
      badge: 'Câmbio Automático',
      icon: 'Sparkles',
      description: 'Scooters automáticas focadas em praticidade urbana, dispensando trocas de marcha e oferecendo espaço integrado para guardar capacete ou bolsa.',
      idealForProfile: 'Deslocamentos diários na cidade que exigem praticidade e pilotagem sem troca de marcha.',
      pros: [
        'Pilotagem simples sem embreagem ou pedal de câmbio',
        'Espaço de bagagem sob o assento',
        'Maior proteção contra sujeira e água da pista'
      ],
      cons: [
        'Manutenção periódica da correia do câmbio CVT',
        'Rodas de aro menor sentem mais buracos profundos'
      ],
      matcher: (item) => item.vehicle.category === 'scooter' && item.vehicle.price >= 17000
    },
    performance_highway: {
      name: 'Média & Alta Cilindrada',
      tagline: 'Maior potência, freios ABS e estabilidade para rodovias e viagens',
      badge: 'Potência & Rodovia',
      icon: 'Flame',
      description: 'Motos naked, custom e de maior cilindrada com motor potente, freios a disco dimensionados e estabilidade para pistas expressas e viagens.',
      idealForProfile: 'Quem busca maior desempenho de motor, viagens em rodovia e ultrapassagens seguras.',
      pros: [
        'Potência e aceleração com folga para ultrapassagens',
        'Conjunto de freios e suspensão estável em velocidade de rodovia',
        'Mais recursos de painel e tecnologia'
      ],
      cons: [
        'Maior consumo de combustível por quilômetro',
        'Custo proporcionalmente mais alto de seguro e manutenção'
      ],
      matcher: (item) => item.vehicle.category === 'naked' || item.vehicle.category === 'custom' || item.vehicle.price > 23000
    }
  };

  const clusters: DecisionCluster[] = [];
  const assigned = new Set<string>();

  for (const [id, def] of Object.entries(clusterDefs)) {
    const groupVehicles = topsisItems.filter(i => !assigned.has(i.vehicle.id) && def.matcher(i));
    groupVehicles.forEach(i => assigned.add(i.vehicle.id));

    if (groupVehicles.length > 0) {
      const avgTCO = groupVehicles.reduce((s, i) => s + i.tco.totalMonthlyTCO, 0) / groupVehicles.length;
      const avgCostKm = groupVehicles.reduce((s, i) => s + i.tco.costPerKm, 0) / groupVehicles.length;
      const avgCi = groupVehicles.reduce((s, i) => s + i.closenessScore, 0) / groupVehicles.length;

      let fit = avgCi * 100;
      if (avgTCO <= profile.budgetLimitMonthly) fit += 10;
      else fit -= Math.min(25, ((avgTCO - profile.budgetLimitMonthly) / profile.budgetLimitMonthly) * 20);

      if (id === 'rugged_utility' && weights.comfort >= 25) fit += 8;
      if (id === 'efficiency_kings' && (weights.economy >= 30 || profile.monthlyKm >= 1500)) fit += 8;
      if (id === 'performance_highway' && (profile.cityRatio <= 0.6 || weights.performance >= 25)) fit += 8;
      if (id === 'resale_liquidity' && weights.resale >= 20) fit += 8;
      if (id === 'urban_comfort' && profile.cityRatio >= 0.85 && weights.comfort >= 20) fit += 8;

      clusters.push({
        id,
        name: def.name,
        tagline: def.tagline,
        badge: def.badge,
        icon: def.icon,
        description: def.description,
        idealForProfile: def.idealForProfile,
        averageMonthlyTCO: Math.round(avgTCO),
        averageCostPerKm: Number(avgCostKm.toFixed(2)),
        averageScoreCi: Number(avgCi.toFixed(3)),
        fitScore: Math.min(99, Math.max(10, Math.round(fit))),
        isRecommended: false,
        pros: def.pros,
        cons: def.cons,
        vehicles: groupVehicles
      });
    }
  }

  // Sobras ou cluster dedicado caso não atinja matchers predefinidos
  const remaining = topsisItems.filter(i => !assigned.has(i.vehicle.id));
  if (remaining.length > 0) {
    if (clusters.length > 0) {
      clusters[0].vehicles.push(...remaining);
    } else {
      const avgTCO = remaining.reduce((s, i) => s + i.tco.totalMonthlyTCO, 0) / remaining.length;
      const avgCostKm = remaining.reduce((s, i) => s + i.tco.costPerKm, 0) / remaining.length;
      const avgCi = remaining.reduce((s, i) => s + i.closenessScore, 0) / remaining.length;
      clusters.push({
        id: 'custom_selection',
        name: 'Estilos Selecionados',
        tagline: 'Alternativas pertencentes aos estilos filtrados',
        badge: 'Seleção do Usuário',
        icon: 'Award',
        description: 'Modelos selecionados conforme as preferências de estilo do decisor.',
        idealForProfile: 'Perfil com preferência definida por estilos específicos.',
        averageMonthlyTCO: Math.round(avgTCO),
        averageCostPerKm: Number(avgCostKm.toFixed(2)),
        averageScoreCi: Number(avgCi.toFixed(3)),
        fitScore: 92,
        isRecommended: true,
        pros: ['Total aderência aos estilos de pilotagem desejados'],
        cons: ['Comparação restrita aos estilos selecionados'],
        vehicles: remaining
      });
    }
  }

  clusters.sort((a, b) => b.fitScore - a.fitScore);
  if (clusters.length > 0) clusters[0].isRecommended = true;

  const recommended = clusters[0];
  const withinBudget = topsisItems.filter(i => i.budgetStatus === 'within_budget').length;

  // Função Analítica: Regressão Temporal de Ciclo de Vida (Manter vs. Trocar)
  const repVehicle = recommended?.vehicles[0]?.vehicle || vehicles[0];
  const annualKm = profile.monthlyKm * 12;
  const initialPrice = repVehicle ? repVehicle.price : 18000;
  const depRate = repVehicle ? repVehicle.fipeDepreciationYearly : 0.06;
  const cityW = profile.cityRatio;
  const hwyW = 1 - profile.cityRatio;
  const harmKml = repVehicle ? 1 / ((cityW / repVehicle.cityKml) + (hwyW / repVehicle.highwayKml)) : 38;
  const annFuel = (annualKm / harmKml) * profile.fuelPriceGasoline;
  const annFixed = repVehicle ? (repVehicle.price * repVehicle.ipvaRate) + repVehicle.insuranceAnnual + repVehicle.licensingAnnual : 2000;

  const projections = [];
  let prevVal = initialPrice;
  let optYear = 3;
  let foundCross = false;

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
    const accKm = annualKm * t;
    const yearDepRate = Math.min(0.25, depRate * (annualDepreciationWeights[t - 1] || 0.7));
    const resVal = Math.round(prevVal * (1 - yearDepRate));
    const annDepLoss = prevVal - resVal;
    prevVal = resVal;

    const aging = lifecycleAgingFactors[t - 1] || (1 + (t - 1) * 0.25);
    const annMaint = Math.round(annualKm * (repVehicle ? repVehicle.maintenancePerKm : 0.10) * aging);
    const annTCO = Math.round(annFuel + annFixed + annMaint + annDepLoss);
    const costKm = Number((annTCO / annualKm).toFixed(2));

    if (!foundCross && annMaint > annDepLoss) {
      optYear = t;
      foundCross = true;
    }

    let rec: 'Manter com Segurança' | 'Janela Ideal de Substituição' | 'Risco Elevado de Corretiva' = 'Manter com Segurança';
    if (!foundCross) {
      rec = 'Manter com Segurança';
    } else if (t < optYear) {
      rec = 'Manter com Segurança';
    } else if (t === optYear || t === optYear + 1) {
      rec = 'Janela Ideal de Substituição';
    } else {
      rec = 'Risco Elevado de Corretiva';
    }

    projections.push({
      year: t,
      accumulatedKm: accKm,
      residualFipeValue: resVal,
      annualDepreciationLoss: annDepLoss,
      annualMaintenanceCost: annMaint,
      annualFuelCost: Math.round(annFuel),
      annualFixedCost: Math.round(annFixed),
      annualTotalTCO: annTCO,
      costPerKmInYear: costKm,
      recommendation: rec
    });
  }

  const executiveSummary = foundCross
    ? `A análise de regressão temporal indica que o ponto ótimo de substituição (Manter vs. Trocar) ocorre no Ano ${optYear} (~${optYear * 12} meses ou ~${(annualKm * optYear).toLocaleString('pt-BR')} km). A partir deste ponto, o custo de manutenção preventiva/corretiva supera a perda por desvalorização FIPE, tornando a substituição economicamente superior à retenção do ativo.`
    : `Com baixa rodagem projetada (~${annualKm.toLocaleString('pt-BR')} km/ano), o custo de manutenção preventiva permanece inferior à desvalorização FIPE em todo o ciclo de 5 anos, indicando retenção vantajosa além de 60 meses com baixo risco corretivo.`;

  const regressionAnalysis = {
    vehicleId: repVehicle ? repVehicle.id : 'default',
    vehicleName: repVehicle ? repVehicle.name : 'Modelo Representante',
    optimalReplacementYear: optYear,
    optimalReplacementMonth: optYear * 12,
    projections,
    executiveSummary
  };

  return {
    clusters,
    recommendedCluster: recommended,
    totalVehiclesAnalyzed: topsisItems.length,
    regressionAnalysis,
    decisionSummary: {
      headline: `Grupo recomendado: ${recommended.name}`,
      justification: `Melhor custo-benefício para rodagem estimada de ${profile.monthlyKm.toLocaleString('pt-BR')} km/mês (${Math.round(profile.cityRatio * 100)}% urbano) dentro do orçamento de R$ ${profile.budgetLimitMonthly.toLocaleString('pt-BR')}/mês, priorizando consumo reduzido e manutenção mais acessível.`,
      budgetComplianceRate: Math.round((withinBudget / topsisItems.length) * 100),
      bestCostPerKm: Number(Math.min(...topsisItems.map(i => i.tco.costPerKm)).toFixed(2)),
      bestFuelEconomyKml: Math.max(...topsisItems.map(i => i.vehicle.cityKml))
    },
    sourceReference: {
      fipeReference: 'Tabela FIPE Oficial',
      inmetroBase: 'PBEV - Programa Brasileiro de Etiquetagem Veicular',
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    }
  };
}
