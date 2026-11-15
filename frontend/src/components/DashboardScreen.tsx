import React, { useState } from 'react';
import { 
  SimulationResponse, 
  UserUsageProfile, 
  DecisionCluster,
  TOPSISResultItem 
} from '../types';
import { 
  X, 
  CheckCircle2,
  Zap,
  Shield,
  Award,
  Sparkles,
  Flame,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

interface DashboardScreenProps {
  simulationData: SimulationResponse;
  profile: UserUsageProfile;
  onNavigateToSimulation?: () => void;
  onNavigateToReports?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  simulationData,
  profile,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<DecisionCluster | null>(
    simulationData.recommendedCluster || simulationData.clusters[0]
  );
  const [selectedVehicle, setSelectedVehicle] = useState<TOPSISResultItem | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({
    [simulationData.recommendedCluster?.id || '']: true
  });

  const toggleGroupExpand = (id: string) => {
    setExpandedGroupIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const recommended = simulationData.recommendedCluster;

  // Dados para o gráfico de comparação entre grupos
  const groupChartData = simulationData.clusters.map(c => ({
    name: c.name.split('&')[0].trim(), // Nome resumido para caber no gráfico
    fullName: c.name,
    tco: c.averageMonthlyTCO,
    fitScore: c.fitScore,
    isRec: c.isRecommended,
  }));

  // Renderizador de Ícone por Grupo
  const renderClusterIcon = (icon: string) => {
    switch (icon) {
      case 'Zap': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Shield': return <Shield className="w-5 h-5 text-emerald-600" />;
      case 'Award': return <Award className="w-5 h-5 text-blue-600" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'Flame': return <Flame className="w-5 h-5 text-rose-500" />;
      default: return <Award className="w-5 h-5 text-slate-700" />;
    }
  };

  // Cores para o gráfico Donut de custos
  const donutColors = ['#2563eb', '#475569', '#64748b', '#0ea5e9', '#059669'];

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Welcome / Decision Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Grupo Recomendado
              </span>
              <span className="text-slate-400 text-xs">
                Aderência: <strong>{recommended?.fitScore}%</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {renderClusterIcon(recommended?.icon || 'Award')}
              <span>{recommended?.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {simulationData.decisionSummary.justification}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px]">TCO Médio Estimado</span>
                <span className="text-sm font-bold text-white">
                  R$ {recommended?.averageMonthlyTCO.toLocaleString('pt-BR')} /mês
                </span>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <span className="text-slate-400 block text-[10px]">Custo Médio / km</span>
                <span className="text-sm font-bold text-emerald-400">
                  R$ {recommended?.averageCostPerKm.toFixed(2)} /km
                </span>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <span className="text-slate-400 block text-[10px]">Opções no Grupo</span>
                <span className="text-sm font-bold text-white">
                  {recommended?.vehicles.length || 0} modelos ({simulationData.totalVehiclesAnalyzed} avaliados)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Grupo com Maior Aderência
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 truncate">
              {recommended?.name.split('&')[0]}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {recommended?.fitScore}% Fit
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {recommended?.tagline}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Menor Custo / Km (Mercado)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              R$ {simulationData.decisionSummary.bestCostPerKm.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              / km rodado
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Melhor marca entre os 201 modelos avaliados
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Conformidade Orçamentária
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {simulationData.decisionSummary.budgetComplianceRate}%
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Teto: R$ {profile.budgetLimitMonthly}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Das 201 motos da base cabem no seu limite
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Melhor Consumo Urbano (Mercado)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {simulationData.decisionSummary.bestFuelEconomyKml} km/l
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Inmetro / PBEV
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Recorde de economia homologado no catálogo
          </span>
        </div>
      </div>

      {/* Gráfico Comparativo entre Grupos de Decisão */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Comparativo de TCO Médio Mensal por Grupo de Decisão
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Avaliação do impacto financeiro médio de cada grupo contra o seu limite orçamentário mensal
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-900 rounded-sm" />
              <span className="text-slate-600">Grupo Recomendado</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-300 rounded-sm" />
              <span className="text-slate-600">Demais Grupos</span>
            </span>
          </div>
        </div>

        <div className="h-64 mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `R$ ${val}`} />
              <Tooltip 
                formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}/mês`, 'TCO Médio']}
                labelFormatter={(label) => `Grupo: ${label}`}
              />
              <ReferenceLine 
                y={profile.budgetLimitMonthly} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                label={{ value: `Teto: R$ ${profile.budgetLimitMonthly}`, fill: '#ef4444', fontSize: 11, position: 'top' }} 
              />
              <Bar dataKey="tco" radius={[6, 6, 0, 0]}>
                {groupChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isRec ? '#0f172a' : '#94a3b8'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista dos Grupos Estratégicos Batizados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Grupos Estratégicos de Decisão ({simulationData.clusters.length} Grupos Mapeados)
          </h2>
          <span className="text-xs text-slate-500">
            Clique no grupo para expandir as motos e detalhes operacionais
          </span>
        </div>

        <div className="space-y-4">
          {simulationData.clusters.map((cluster) => {
            const isExpanded = !!expandedGroupIds[cluster.id];
            const isRec = cluster.isRecommended;

            return (
              <div 
                key={cluster.id}
                className={`bg-white rounded-xl border transition-all ${
                  isRec 
                    ? 'border-slate-900 shadow-md ring-1 ring-slate-900/10' 
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Header do Grupo */}
                <div 
                  onClick={() => toggleGroupExpand(cluster.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isRec ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {renderClusterIcon(cluster.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{cluster.name}</h3>
                        {isRec && (
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Grupo Recomendado
                          </span>
                        )}
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {cluster.vehicles.length} {cluster.vehicles.length === 1 ? 'modelo' : 'modelos'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{cluster.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-8 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">TCO Médio</span>
                      <span className="text-sm font-bold text-slate-900">
                        R$ {cluster.averageMonthlyTCO.toLocaleString('pt-BR')} <span className="text-[10px] text-slate-500 font-normal">/mês</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Aderência (Fit)</span>
                      <span className={`text-sm font-bold ${cluster.fitScore >= 75 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {cluster.fitScore}%
                      </span>
                    </div>

                    <div className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido do Grupo */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                    
                    {/* Descrição e Perfil Ideal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-800 block mb-1">
                          Perfil Operacional Indicado
                        </span>
                        <p className="text-slate-600 leading-relaxed">{cluster.idealForProfile}</p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-emerald-700 block">
                            Principais Vantagens do Grupo:
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {cluster.pros.map((p, i) => (
                              <li key={i} className="text-slate-600 flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">&bull;</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold uppercase text-amber-700 block">
                            Pontos de Atenção / Trade-offs:
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {cluster.cons.map((c, i) => (
                              <li key={i} className="text-slate-600 flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">&bull;</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Motos pertencentes ao Grupo */}
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block mb-2">
                        Motocicletas Representantes do Grupo ({cluster.name}):
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cluster.vehicles.map((item) => (
                          <div 
                            key={item.vehicle.id}
                            onClick={() => setSelectedVehicle(item)}
                            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white shadow-2xs transition-all cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <span className="text-[9px] font-semibold uppercase text-slate-400 block">
                                    {item.vehicle.brand} &bull; {item.vehicle.category}
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{item.vehicle.name}</h4>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">TCO Mensal</span>
                                  <span className="font-semibold text-slate-900">
                                    R$ {Math.round(item.tco.totalMonthlyTCO).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Custo / km</span>
                                  <span className="font-semibold text-emerald-600">
                                    R$ {item.tco.costPerKm.toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Consumo Urbano</span>
                                  <span className="font-medium text-slate-700">
                                    {item.vehicle.cityKml} km/l
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Preço FIPE</span>
                                  <span className="font-medium text-slate-700">
                                    R$ {item.vehicle.price.toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className={`font-medium ${
                                item.budgetStatus === 'within_budget' ? 'text-emerald-600' : 'text-amber-600'
                              }`}>
                                {item.budgetStatus === 'within_budget' ? 'Dentro do Limite' : 'Alerta Orçamento'}
                              </span>
                              <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                                Ver Detalhes &rarr;
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal / Drawer com Detalhes da Moto Específica */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {selectedVehicle.vehicle.brand} &bull; {selectedVehicle.vehicle.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedVehicle.vehicle.name}</h3>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              
              {/* TCO Mensal Detalhado */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                  Composição do TCO Mensal (Total: R$ {Math.round(selectedVehicle.tco.totalMonthlyTCO).toLocaleString('pt-BR')}/mês)
                </span>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Combustível ({profile.monthlyKm} km):</span>
                    <span className="font-semibold text-slate-900">R$ {selectedVehicle.tco.monthlyFuelCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cesta de Peças e Revisão (óleo/relação/pneus):</span>
                    <span className="font-semibold text-slate-900">R$ {selectedVehicle.tco.monthlyMaintenanceCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custos Fixos (IPVA + Seguro + Licenciamento):</span>
                    <span className="font-semibold text-slate-900">R$ {selectedVehicle.tco.monthlyFixedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depreciação FIPE Rateada:</span>
                    <span className="font-semibold text-slate-900">R$ {selectedVehicle.tco.monthlyDepreciationCost.toFixed(2)}</span>
                  </div>
                  {profile.isFinanced && (
                    <div className="flex justify-between text-blue-700">
                      <span>Parcela Estimada de Financiamento:</span>
                      <span className="font-semibold">R$ {selectedVehicle.tco.monthlyCapitalOrFinancing.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas Qualitativas TOPSIS */}
              <div>
                <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                  Notas de Engenharia e Mercado (Critérios TOPSIS):
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Conforto</span>
                    <span className="text-xs font-bold text-slate-800">{selectedVehicle.vehicle.comfortScore} / 5</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Motor</span>
                    <span className="text-xs font-bold text-slate-800">{selectedVehicle.vehicle.performanceScore} / 5</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Mecânica</span>
                    <span className="text-xs font-bold text-slate-800">{selectedVehicle.vehicle.reliabilityScore} / 5</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Revenda</span>
                    <span className="text-xs font-bold text-slate-800">{selectedVehicle.vehicle.resaleLiquidityScore} / 5</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
