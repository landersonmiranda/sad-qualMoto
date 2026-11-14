import React from 'react';
import { 
  SimulationResponse, 
  UserUsageProfile, 
  CriteriaWeights
} from '../types';
import { Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ReportsScreenProps {
  simulationData: SimulationResponse;
  profile: UserUsageProfile;
  weights: CriteriaWeights;
  userEmail: string;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  simulationData,
  profile,
  weights,
}) => {
  const recommended = simulationData.recommendedCluster;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Action Bar (no-print) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Relatório de Apoio à Decisão
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Documento consolidado pronto para impressão e auditoria do modelo
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* Printable Report Document (A4 White Sheet) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Relatório de Decisão Multicritério para Aquisição de Motocicletas
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Método: TOPSIS (*Technique for Order Preference by Similarity to Ideal Solution*), TCO & Clusterização Estratégica
            </p>
          </div>

          <div className="text-right text-xs">
            <p className="text-slate-500">
              Data de Emissão: <strong className="text-slate-900 font-mono">{currentDate}</strong>
            </p>
          </div>
        </div>

        {/* Section 1: Executive Summary por Grupos */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Parecer Estratégico Conclusivo da Recomendação
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {simulationData.decisionSummary.justification}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Grupo Vencedor:</span>
              <strong className="text-slate-900">{recommended?.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TCO Médio Estimado:</span>
              <strong className="text-slate-900 font-mono">R$ {recommended?.averageMonthlyTCO.toLocaleString('pt-BR')} /mês</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Custo Operacional por Km:</span>
              <strong className="text-emerald-700 font-mono">R$ {recommended?.averageCostPerKm.toFixed(2)} /km</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Input Parameters */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            2. Matriz de Parâmetros Operacionais e Pesos Adotados
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Quilometragem:</span>
              <strong className="text-slate-900 font-mono">{profile.monthlyKm} km/mês</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Gasolina Local:</span>
              <strong className="text-slate-900 font-mono">R$ {profile.fuelPriceGasoline.toFixed(2)} / L</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Trajeto Urbano:</span>
              <strong className="text-slate-900 font-mono">{Math.round(profile.cityRatio * 100)}% Cidade</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Orçamento Teto:</span>
              <strong className="text-slate-900 font-mono">R$ {profile.budgetLimitMonthly.toLocaleString('pt-BR')}</strong>
            </div>
          </div>

          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>Pesos Multicritério:</span>
            <span>Economia (TCO): <strong className="text-slate-900 font-mono">{weights.economy}%</strong></span>
            <span>Conforto: <strong className="text-slate-900 font-mono">{weights.comfort}%</strong></span>
            <span>Desempenho: <strong className="text-slate-900 font-mono">{weights.performance}%</strong></span>
            <span>Confiabilidade: <strong className="text-slate-900 font-mono">{weights.reliability}%</strong></span>
            <span>Revenda FIPE: <strong className="text-slate-900 font-mono">{weights.resale}%</strong></span>
          </div>
        </div>

        {/* Section Formal: Funções Analíticas Empregadas (Item 2 do Edital) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            3. Formalização das Funções Analíticas do SAD (Requisito Acadêmico - Item 2)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">1. Sumarização Financeira (TCO & Custo/km)</span>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Entrada:</strong> Preço FIPE, consumo Inmetro, IPVA 2%, seguro, manutenção/km e km rodada.</p>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Processamento:</strong> Média harmônica de consumo, rateio de fixos e depreciação anual.</p>
              <p className="text-slate-800 text-[11px] font-semibold mt-1"><strong className="text-slate-700 font-bold">Resultado Decisório:</strong> TCO Mensal, Anual e Custo por Km comparável entre alternativas.</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">2. Agrupamento (Clusters Estratégicos Batizados)</span>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Entrada:</strong> Vetores multicritério, categorias operacionais e coeficientes de proximidade.</p>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Processamento:</strong> Clusterização em 5 grupos funcionais e cálculo de médias consolidadas.</p>
              <p className="text-slate-800 text-[11px] font-semibold mt-1"><strong className="text-slate-700 font-bold">Resultado Decisório:</strong> Indicação do Grupo com Maior FitScore aderente ao decisor.</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">3. Classificação Multicritério (TOPSIS & Orçamento)</span>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Entrada:</strong> Matriz de decisão normalizada, vetor de pesos e teto financeiro mensal.</p>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Processamento:</strong> Distâncias euclidianas S+ e S-, Coeficiente Ci e checagem de teto.</p>
              <p className="text-slate-800 text-[11px] font-semibold mt-1"><strong className="text-slate-700 font-bold">Resultado Decisório:</strong> Ordenação matemática de proximidade à solução ideal e classes orçamentárias.</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">4. Regressão Temporal (Ciclo de Vida Manter vs. Trocar)</span>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Entrada:</strong> Preço inicial FIPE, desvalorização exponencial e taxa de envelhecimento mecânico.</p>
              <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Processamento:</strong> V(t) = V0*(1-d)^t cruzado com curva não-linear de custos de manutenção.</p>
              <p className="text-slate-800 text-[11px] font-semibold mt-1"><strong className="text-slate-700 font-bold">Resultado Decisório:</strong> Ponto ótimo de substituição (Ano {simulationData.regressionAnalysis?.optimalReplacementYear || 3} / ~{(simulationData.regressionAnalysis?.optimalReplacementYear || 3) * 12} meses).</p>
            </div>

          </div>
        </div>

        {/* Section 3: Tabela de Grupos Estratégicos */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            3. Avaliação Comparativa dos Grupos Estratégicos de Decisão
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Grupo Estratégico</th>
                  <th className="py-2.5 px-3">Perfil Indicado</th>
                  <th className="py-2.5 px-3 font-mono">TCO Médio</th>
                  <th className="py-2.5 px-3 font-mono">Custo / km</th>
                  <th className="py-2.5 px-3 font-mono">Aderência (Fit)</th>
                  <th className="py-2.5 px-3 text-right">Classificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {simulationData.clusters.map((cluster) => (
                  <tr key={cluster.id} className={cluster.isRecommended ? 'bg-emerald-50/40 font-medium' : ''}>
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 block">{cluster.name}</strong>
                      <span className="text-[10px] text-slate-500 font-normal">{cluster.tagline}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {cluster.idealForProfile.slice(0, 75)}...
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-900">
                      R$ {cluster.averageMonthlyTCO.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-900">
                      R$ {cluster.averageCostPerKm.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {cluster.fitScore}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {cluster.isRecommended ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Recomendado
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Alternativa</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Fontes Oficiais & Auditoria */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>
            Fontes públicas: <strong>{simulationData.sourceReference.fipeReference}</strong> &bull; {simulationData.sourceReference.inmetroBase}
          </p>
        </div>

      </div>

    </div>
  );
};
