import { Injectable } from '@nestjs/common';
import { FipeService } from '../fipe/fipe.service';
import { TopsisService } from './topsis.service';
import { ClusteringService } from './clustering.service';
import { RegressionService } from './regression.service';
import { UserUsageProfile, CriteriaWeights, SimulationResponse, Vehicle } from '../common/types';

@Injectable()
export class DecisionService {
  constructor(
    private readonly fipeService: FipeService,
    private readonly topsisService: TopsisService,
    private readonly clusteringService: ClusteringService,
    private readonly regressionService: RegressionService,
  ) {}

  async simulate(
    profile: UserUsageProfile,
    weights: CriteriaWeights,
    customVehicles?: Vehicle[]
  ): Promise<SimulationResponse> {
    // Se foram fornecidos veículos customizados pelo usuário, utiliza-os; senão, utiliza a base pública FIPE
    const baseVehicles = (customVehicles && customVehicles.length > 0)
      ? customVehicles
      : await this.fipeService.getAllVehicles();

    // Filtra por estilos/categorias preferidos se selecionados pelo usuário
    const filteredVehicles = (profile.preferredCategories && profile.preferredCategories.length > 0)
      ? baseVehicles.filter(v => profile.preferredCategories!.includes(v.category))
      : baseVehicles;
    const vehiclesToUse = filteredVehicles.length > 0 ? filteredVehicles : baseVehicles;

    // 1. Executa o algoritmo TOPSIS multicritério (Classificação)
    const topsisItems = this.topsisService.run(vehiclesToUse, profile, weights);

    // 2. Executa a Clusterização Estratégica Batizada (Agrupamento)
    const simulationResult = this.clusteringService.clusterResults(topsisItems, profile, weights);

    // 3. Executa a Análise de Regressão Temporal de Ciclo de Vida (Regressão: Manter vs. Trocar)
    const primaryVehicle = simulationResult.recommendedCluster?.vehicles[0]?.vehicle || vehiclesToUse[0];
    if (primaryVehicle) {
      simulationResult.regressionAnalysis = this.regressionService.calculateReplacementCurve(primaryVehicle, profile);
    }

    return simulationResult;
  }
}

