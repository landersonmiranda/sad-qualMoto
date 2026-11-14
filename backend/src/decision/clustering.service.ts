import { Injectable } from '@nestjs/common';
import { 
  TOPSISResultItem, 
  UserUsageProfile, 
  CriteriaWeights, 
  DecisionCluster, 
  SimulationResponse 
} from '../common/types';

@Injectable()
export class ClusteringService {
  /**
   * Agrupa as alternativas em Clusters Estratégicos Batizados
   * e gera uma recomendação orientada a grupos.
   */
  clusterResults(
    topsisItems: TOPSISResultItem[],
    profile: UserUsageProfile,
    weights: CriteriaWeights
  ): SimulationResponse {
    // Definição dos Grupos Estratégicos Batizados
    const clusterDefinitions: Record<string, {
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
        matcher: (item) => {
          return item.vehicle.category === 'trail';
        }
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
        matcher: (item) => {
          return item.vehicle.category === 'street' && item.vehicle.price >= 16000 && item.vehicle.resaleLiquidityScore >= 4.5;
        }
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
        matcher: (item) => {
          return item.vehicle.category === 'scooter' && item.vehicle.price >= 17000;
        }
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
        matcher: (item) => {
          return item.vehicle.category === 'naked' || item.vehicle.category === 'custom' || item.vehicle.price > 23000;
        }
      }
    };

    // Montagem dos clusters agrupando os itens do TOPSIS
    const clusters: DecisionCluster[] = [];

    // Conjunto para evitar que a mesma moto fique sem grupo
    const assignedIds = new Set<string>();

    for (const [clusterId, def] of Object.entries(clusterDefinitions)) {
      const groupVehicles = topsisItems.filter(item => {
        if (assignedIds.has(item.vehicle.id)) return false;
        return def.matcher(item);
      });

      // Marca como atribuídas
      groupVehicles.forEach(item => assignedIds.add(item.vehicle.id));

      if (groupVehicles.length > 0) {
        const avgTCO = groupVehicles.reduce((s, i) => s + i.tco.totalMonthlyTCO, 0) / groupVehicles.length;
        const avgCostKm = groupVehicles.reduce((s, i) => s + i.tco.costPerKm, 0) / groupVehicles.length;
        const avgCi = groupVehicles.reduce((s, i) => s + i.closenessScore, 0) / groupVehicles.length;

        // Fit score baseado no alinhamento do grupo com o perfil e pesos
        let fit = avgCi * 100;
        // Bonificação se TCO do grupo respeita o limite de orçamento
        if (avgTCO <= profile.budgetLimitMonthly) {
          fit += 10;
        } else {
          fit -= Math.min(25, ((avgTCO - profile.budgetLimitMonthly) / profile.budgetLimitMonthly) * 20);
        }

        // Bonificação por alinhamento de perfil de uso
        if (clusterId === 'rugged_utility' && weights.comfort >= 25) fit += 8;
        if (clusterId === 'efficiency_kings' && (weights.economy >= 30 || profile.monthlyKm >= 1500)) fit += 8;
        if (clusterId === 'performance_highway' && (profile.cityRatio <= 0.6 || weights.performance >= 25)) fit += 8;
        if (clusterId === 'resale_liquidity' && weights.resale >= 20) fit += 8;
        if (clusterId === 'urban_comfort' && profile.cityRatio >= 0.85 && weights.comfort >= 20) fit += 8;

        clusters.push({
          id: clusterId,
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

    // Se sobrou alguma moto não agrupada, agrupa na categoria mais próxima ou cria cluster dedicado
    const unassigned = topsisItems.filter(item => !assignedIds.has(item.vehicle.id));
    if (unassigned.length > 0) {
      if (clusters.length > 0) {
        clusters[0].vehicles.push(...unassigned);
      } else {
        const avgTCO = unassigned.reduce((s, i) => s + i.tco.totalMonthlyTCO, 0) / unassigned.length;
        const avgCostKm = unassigned.reduce((s, i) => s + i.tco.costPerKm, 0) / unassigned.length;
        const avgCi = unassigned.reduce((s, i) => s + i.closenessScore, 0) / unassigned.length;
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
          vehicles: unassigned
        });
      }
    }

    // Ordenação dos clusters por FitScore decrescente
    clusters.sort((a, b) => b.fitScore - a.fitScore);

    // Marca o grupo com maior fitScore como recomendado
    if (clusters.length > 0) {
      clusters[0].isRecommended = true;
    }

    const recommended = clusters[0];

    // Estatísticas gerais
    const totalVehicles = topsisItems.length;
    const withinBudgetCount = topsisItems.filter(i => i.budgetStatus === 'within_budget').length;
    const budgetComplianceRate = Math.round((withinBudgetCount / totalVehicles) * 100);
    const bestCostPerKm = Math.min(...topsisItems.map(i => i.tco.costPerKm));
    const bestFuelEconomyKml = Math.max(...topsisItems.map(i => i.vehicle.cityKml));

    // Justificativa objetiva e direta
    let headline = `Grupo recomendado: ${recommended.name}`;
    let justification = `Melhor custo-benefício para rodagem estimada de ${profile.monthlyKm.toLocaleString('pt-BR')} km/mês (${Math.round(profile.cityRatio * 100)}% urbano) dentro do orçamento de R$ ${profile.budgetLimitMonthly.toLocaleString('pt-BR')}/mês, priorizando consumo reduzido e manutenção mais acessível.`;

    return {
      clusters,
      recommendedCluster: recommended,
      totalVehiclesAnalyzed: totalVehicles,
      decisionSummary: {
        headline,
        justification,
        budgetComplianceRate,
        bestCostPerKm: Number(bestCostPerKm.toFixed(2)),
        bestFuelEconomyKml
      },
      sourceReference: {
        fipeReference: 'Tabela FIPE Oficial',
        inmetroBase: 'PBEV - Programa Brasileiro de Etiquetagem Veicular',
        lastUpdated: new Date().toLocaleDateString('pt-BR')
      }
    };
  }
}

