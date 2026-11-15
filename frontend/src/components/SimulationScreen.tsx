import React, { useState } from 'react';
import { 
  SimulationResponse, 
  UserUsageProfile, 
  CriteriaWeights,
  MotoCategory
} from '../types';
import { 
  Sliders, 
  Scale, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  Award,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

interface SimulationScreenProps {
  simulationData: SimulationResponse;
  profile: UserUsageProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserUsageProfile>>;
  weights: CriteriaWeights;
  setWeights: React.Dispatch<React.SetStateAction<CriteriaWeights>>;
}

const STYLE_OPTIONS: { id: MotoCategory; label: string; count: number }[] = [
  { id: 'street', label: 'Street / Urbana', count: 24 },
  { id: 'trail', label: 'Trail / Misto', count: 58 },
  { id: 'scooter', label: 'Scooter / CUB', count: 26 },
  { id: 'naked', label: 'Naked / Esportiva', count: 52 },
  { id: 'custom', label: 'Custom / Clássica', count: 41 },
];

export const SimulationScreen: React.FC<SimulationScreenProps> = ({
  simulationData,
  profile,
  setProfile,
  weights,
  setWeights,
}) => {
  const [activeTab, setActiveTab] = useState<'usage' | 'weights'>('usage');
  const [showBreakEven, setShowBreakEven] = useState(false);

  const selectedCategories = profile.preferredCategories || [];

  const handleToggleCategory = (cat: MotoCategory) => {
    setProfile(prev => {
      const current = prev.preferredCategories || [];
      if (current.includes(cat)) {
        const next = current.filter(c => c !== cat);
        return { ...prev, preferredCategories: next };
      } else {
        return { ...prev, preferredCategories: [...current, cat] };
      }
    });
  };

  const handleSelectAll = () => {
    setProfile(prev => ({ ...prev, preferredCategories: [] }));
  };

  const recommendedGroup = simulationData.recommendedCluster;
  const runnerUpGroup = simulationData.clusters[1] || simulationData.clusters[0];

  const winner = recommendedGroup?.vehicles[0];
  const runnerUp = runnerUpGroup?.vehicles[0] || recommendedGroup?.vehicles[1];

  // Converte TCO mensal em nota de 1 a 5 (menor custo = maior nota de economia no radar)
  const calcEconomyRadarScore = (item?: any) => {
    if (!item?.tco?.totalMonthlyTCO) return 3.5;
    const tco = item.tco.totalMonthlyTCO;
    // TCO <= 450 R$/mês recebe nota 5.0; TCO >= 2200 R$/mês recebe 1.0
    const score = 5 - ((tco - 450) / (2200 - 450)) * 4;
    return Number(Math.max(1, Math.min(5, score)).toFixed(1));
  };

  // Dados do Radar Multicritério com cores limpas
  const radarData = [
    {
      subject: 'Economia (TCO)',
      fullMark: 5,
      Vencedor: calcEconomyRadarScore(winner),
      Segundo: calcEconomyRadarScore(runnerUp),
    },
    {
      subject: 'Conforto / Suspensão',
      fullMark: 5,
      Vencedor: winner?.vehicle.comfortScore || 3,
      Segundo: runnerUp?.vehicle.comfortScore || 3,
    },
    {
      subject: 'Desempenho / Motor',
      fullMark: 5,
      Vencedor: winner?.vehicle.performanceScore || 3,
      Segundo: runnerUp?.vehicle.performanceScore || 3,
    },
    {
      subject: 'Peças & Mecânica',
      fullMark: 5,
      Vencedor: winner?.vehicle.reliabilityScore || 4,
      Segundo: runnerUp?.vehicle.reliabilityScore || 4,
    },
    {
      subject: 'Revenda FIPE',
      fullMark: 5,
      Vencedor: winner?.vehicle.resaleLiquidityScore || 4,
      Segundo: runnerUp?.vehicle.resaleLiquidityScore || 4,
    },
  ];

  // Dados dinâmicos calculados pela Função Analítica: Regressão Temporal de Ciclo de Vida
  const regression = simulationData.regressionAnalysis;
  const breakEvenData = regression?.projections.map(p => ({
    periodo: `Ano ${p.year}`,
    km: `${(p.accumulatedKm / 1000).toFixed(0)}k km`,
    manutencao: p.annualMaintenanceCost,
    depreciacao: p.annualDepreciationLoss,
    tcoTotal: p.annualTotalTCO,
    custoKm: p.costPerKmInYear,
    status: p.recommendation
  })) || [
    { periodo: 'Ano 1', km: '12k km', manutencao: 1440, depreciacao: 1980, tcoTotal: 7200, custoKm: 0.60, status: 'Manter com Segurança' },
    { periodo: 'Ano 2', km: '24k km', manutencao: 1700, depreciacao: 1870, tcoTotal: 7350, custoKm: 0.61, status: 'Manter com Segurança' },
    { periodo: 'Ano 3', km: '36k km', manutencao: 2050, depreciacao: 1760, tcoTotal: 7600, custoKm: 0.63, status: 'Janela Ideal de Substituição' },
    { periodo: 'Ano 4', km: '48k km', manutencao: 2480, depreciacao: 1650, tcoTotal: 7920, custoKm: 0.66, status: 'Janela Ideal de Substituição' },
    { periodo: 'Ano 5', km: '60k km', manutencao: 3100, depreciacao: 1540, tcoTotal: 8430, custoKm: 0.70, status: 'Risco Elevado de Corretiva' }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Simulação
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Altere as variáveis para ver a reordenação instantânea do ranking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Controls with Tabs */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Style Preferences Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-900">Estilos de Motocicleta</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedCategories.length === 0
                  ? 'Todas (201 motos)'
                  : `${simulationData.totalVehiclesAnalyzed} motos filtradas`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedCategories.length === 0
                    ? 'bg-blue-600 text-white font-medium border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
              {STYLE_OPTIONS.map(opt => {
                const isSelected = selectedCategories.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleCategory(opt.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      isSelected ? 'bg-blue-200/60 text-blue-800' : 'text-slate-400'
                    }`}>
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Tabs Selector: Divides details into 2 digestible tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-medium">
              <button
                onClick={() => setActiveTab('usage')}
                className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'usage'
                    ? 'bg-white text-blue-600 font-semibold border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>1. Meu Uso & Trajeto</span>
              </button>
              <button
                onClick={() => setActiveTab('weights')}
                className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'weights'
                    ? 'bg-white text-blue-600 font-semibold border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>2. Minhas Preferências</span>
              </button>
            </div>

            {/* TAB 1: USAGE SLIDERS */}
            {activeTab === 'usage' && (
              <div className="p-5 space-y-4">
                
                {/* Quilometragem */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Quilometragem por Mês:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="100"
                        max="8000"
                        step="50"
                        value={profile.monthlyKm}
                        onChange={(e) => setProfile(prev => ({ ...prev, monthlyKm: Math.max(0, Number(e.target.value)) }))}
                        className="w-24 text-right font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs font-mono text-slate-500">km/mês</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="5000"
                    step="50"
                    value={Math.min(5000, profile.monthlyKm)}
                    onChange={(e) => setProfile(prev => ({ ...prev, monthlyKm: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>200 km (Lazer/Perto)</span>
                    <span>1.500 km (Média diária)</span>
                    <span>5.000 km (Delivery Intenso)</span>
                  </div>
                </div>

                {/* Preço da Gasolina */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Preço da Gasolina Local (ANP):</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-slate-500">R$</span>
                      <input
                        type="number"
                        min="3.50"
                        max="10.00"
                        step="0.01"
                        value={profile.fuelPriceGasoline}
                        onChange={(e) => setProfile(prev => ({ ...prev, fuelPriceGasoline: Number(e.target.value) }))}
                        className="w-20 text-right font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs font-mono text-slate-500">/L</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="4.50"
                    max="9.00"
                    step="0.05"
                    value={profile.fuelPriceGasoline}
                    onChange={(e) => setProfile(prev => ({ ...prev, fuelPriceGasoline: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>R$ 4,50</span>
                    <span>Média ANP (R$ 5,89)</span>
                    <span>R$ 9,00</span>
                  </div>
                </div>

                {/* Proporção Urbana vs Rodovia */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Proporção Urbana vs Rodovia:</span>
                    <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {Math.round(profile.cityRatio * 100)}% Cidade / {Math.round((1 - profile.cityRatio) * 100)}% Estrada
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.00"
                    step="0.05"
                    value={profile.cityRatio}
                    onChange={(e) => setProfile(prev => ({ ...prev, cityRatio: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>100% Estrada</span>
                    <span>Misto (50/50)</span>
                    <span>100% Trânsito Urbano</span>
                  </div>
                </div>

                {/* Limite Orçamentário Mensal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Limite Orçamentário Mensal (Teto):</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-slate-500">R$</span>
                      <input
                        type="number"
                        min="200"
                        max="15000"
                        step="50"
                        value={profile.budgetLimitMonthly}
                        onChange={(e) => setProfile(prev => ({ ...prev, budgetLimitMonthly: Math.max(0, Number(e.target.value)) }))}
                        className="w-24 text-right font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs font-mono text-slate-500">/mês</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="4000"
                    step="50"
                    value={Math.min(4000, profile.budgetLimitMonthly)}
                    onChange={(e) => setProfile(prev => ({ ...prev, budgetLimitMonthly: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>R$ 300/mês</span>
                    <span>R$ 1.500/mês</span>
                    <span>R$ 4.000/mês (ou digite acima)</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: WEIGHTS SLIDERS */}
            {activeTab === 'weights' && (
              <div className="p-5 space-y-3.5">
                <p className="text-xs text-slate-500 pb-1 border-b border-slate-100">
                  Defina o que é mais importante para você na decisão:
                </p>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">Economia Financeira (Menor TCO):</span>
                    <span className="font-mono font-bold text-blue-600">{weights.economy}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={weights.economy}
                    onChange={(e) => setWeights(prev => ({ ...prev, economy: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">Conforto e Ergonomia:</span>
                    <span className="font-mono font-bold text-slate-900">{weights.comfort}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={weights.comfort}
                    onChange={(e) => setWeights(prev => ({ ...prev, comfort: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">Potência e Desempenho:</span>
                    <span className="font-mono font-bold text-slate-900">{weights.performance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={weights.performance}
                    onChange={(e) => setWeights(prev => ({ ...prev, performance: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">Confiabilidade Mecânica:</span>
                    <span className="font-mono font-bold text-slate-900">{weights.reliability}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={weights.reliability}
                    onChange={(e) => setWeights(prev => ({ ...prev, reliability: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">Liquidez de Revenda FIPE:</span>
                    <span className="font-mono font-bold text-slate-900">{weights.resale}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={weights.resale}
                    onChange={(e) => setWeights(prev => ({ ...prev, resale: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

              </div>
            )}

          </div>

          {/* Quick Winner Callout */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Grupo Recomendado</span>
              <span className="text-sm font-bold text-slate-900">{recommendedGroup?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Aderência ao Perfil</span>
              <span className="text-sm font-bold text-emerald-600">{recommendedGroup?.fitScore}% Fit</span>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Outputs */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Radar Chart Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Comparativo Multicritério dos Grupos</h3>
                <p className="text-xs text-slate-500">Equilíbrio dimensional entre os dois principais grupos estratégicos</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-900 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> {recommendedGroup?.name.split('&')[0]}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> {runnerUpGroup?.name.split('&')[0]}
                </span>
              </div>
            </div>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#cbd5e1" tick={{ fontSize: 10 }} />
                  <Radar
                    name={recommendedGroup?.name || 'Grupo Recomendado'}
                    dataKey="Vencedor"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name={runnerUpGroup?.name || 'Segundo Grupo'}
                    dataKey="Segundo"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.15}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progressive Disclosure: Break-Even Chart (Click to expand!) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowBreakEven(!showBreakEven)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900">
                    Regressão de Ciclo de Vida: Grupo Recomendado (Manter vs. Trocar)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Projeção temporal de depreciação vs. manutenção preventiva e corretiva
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                {showBreakEven ? 'Ocultar gráfico' : 'Ver curva'}
                {showBreakEven ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {showBreakEven && (
              <div className="p-5 pt-1 border-t border-slate-100 animate-fadeIn space-y-3">
                <div className="h-52 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={breakEvenData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="periodo" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem' }}
                        formatter={(val) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="manutencao"
                        name="Custo Manutenção Acumulado (R$/ano)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="depreciacao"
                        name="Perda Depreciação FIPE (R$/ano)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  <strong className="text-slate-900">Ponto de Inflexão e Decisão de Substituição:</strong> {regression?.executiveSummary}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
