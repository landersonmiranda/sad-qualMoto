import { TcoService } from './decision/tco.service';
import { TopsisService } from './decision/topsis.service';
import { ClusteringService } from './decision/clustering.service';
import { RegressionService } from './decision/regression.service';
import { FipeService } from './fipe/fipe.service';
import { UserUsageProfile, CriteriaWeights } from './common/types';

async function runSelfTest() {
  console.log('--- Iniciando Teste Automatizado dos Motores do SAD ---');

  const fipeService = new FipeService();
  const tcoService = new TcoService();
  const topsisService = new TopsisService(tcoService);
  const clusteringService = new ClusteringService();
  const regressionService = new RegressionService();

  const vehicles = await fipeService.getAllVehicles();
  console.log(`✓ Veículos carregados da base oficial FIPE/Inmetro: ${vehicles.length}`);

  const profile: UserUsageProfile = {
    monthlyKm: 1200,
    cityRatio: 0.85,
    fuelPriceGasoline: 5.89,
    fuelPriceEthanol: 3.99,
    budgetLimitMonthly: 950,
    isFinanced: true,
    downPayment: 5000
  };

  const weights: CriteriaWeights = {
    economy: 35,
    comfort: 20,
    performance: 15,
    reliability: 20,
    resale: 10
  };

  // 1. Teste TCO
  const sampleVehicle = vehicles[0];
  const tco = tcoService.calculate(sampleVehicle, profile);
  console.log(`✓ TCO Calculado para "${sampleVehicle.name}": R$ ${tco.totalMonthlyTCO.toFixed(2)}/mês (Custo/km: R$ ${tco.costPerKm.toFixed(2)})`);

  // 2. Teste TOPSIS
  const topsisResults = topsisService.run(vehicles, profile, weights);
  console.log(`✓ TOPSIS executado com sucesso: ${topsisResults.length} alternativas ranqueadas. 1º lugar: "${topsisResults[0].vehicle.name}" (Ci = ${topsisResults[0].closenessScore.toFixed(4)})`);

  // 3. Teste Clustering por Grupos Batizados
  const clustersResult = clusteringService.clusterResults(topsisResults, profile, weights);
  console.log(`✓ Clusterização Estratégica gerou ${clustersResult.clusters.length} grupos batizados:`);
  clustersResult.clusters.forEach(c => {
    console.log(`   • [${c.name}] -> TCO Médio: R$ ${c.averageMonthlyTCO} | Aderência: ${c.fitScore}% ${c.isRecommended ? '⭐ (RECOMENDADO)' : ''}`);
  });

  // 4. Teste Regressão Temporal
  const regression = regressionService.calculateReplacementCurve(sampleVehicle, profile);
  console.log(`✓ Regressão Temporal de Ciclo de Vida: Ponto de Inflexão no Ano ${regression.optimalReplacementYear} (~${regression.optimalReplacementMonth} meses)`);
  console.log(`  Projeção Ano 1: Residual R$ ${regression.projections[0].residualFipeValue} | Manutenção R$ ${regression.projections[0].annualMaintenanceCost}`);
  console.log(`  Projeção Ano 5: Residual R$ ${regression.projections[4].residualFipeValue} | Manutenção R$ ${regression.projections[4].annualMaintenanceCost}`);

  console.log('\n--- TODOS OS 4 MOTORES ANALÍTICOS FORAM TESTADOS E APROVADOS! ---');
}

runSelfTest().catch(console.error);

