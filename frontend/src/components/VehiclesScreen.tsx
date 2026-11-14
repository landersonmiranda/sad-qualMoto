import React, { useState } from 'react';
import { Vehicle, MotoCategory } from '../types';
import {
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Search,
  Database,
  Fuel,
  Wrench,
  DollarSign,
  Shield,
  X,
  Globe,
  Loader2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import {
  fetchFipePriceByCode,
  parseFipeCurrencyToNumber,
  generateDefaultOperationalProfile
} from '../services/fipeService';

interface VehiclesScreenProps {
  vehicles: Vehicle[];
  onSaveVehicles: (newVehicles: Vehicle[]) => void;
  onResetToDefault: () => void;
}

// Exemplos de códigos FIPE oficiais de motocicletas para importação rápida
const POPULAR_FIPE_CODES = [
  { code: '805047-9', name: 'Honda CG 160 Titan', brand: 'Honda', cat: 'street' as MotoCategory },
  { code: '827135-6', name: 'Yamaha Factor 150 Flex', brand: 'Yamaha', cat: 'street' as MotoCategory },
  { code: '827104-1', name: 'Yamaha Fazer 150 UBS', brand: 'Yamaha', cat: 'street' as MotoCategory },
  { code: '805046-0', name: 'Honda NXR 160 Bros ESDD', brand: 'Honda', cat: 'trail' as MotoCategory },
  { code: '827103-3', name: 'Yamaha Crosser 150 Z ABS', brand: 'Yamaha', cat: 'trail' as MotoCategory },
  { code: '805044-4', name: 'Honda Biz 125 Flex', brand: 'Honda', cat: 'scooter' as MotoCategory },
  { code: '805049-5', name: 'Honda PCX 160 CBS', brand: 'Honda', cat: 'scooter' as MotoCategory },
  { code: '827110-6', name: 'Yamaha FZ25 Fazer 250 ABS', brand: 'Yamaha', cat: 'naked' as MotoCategory },
  { code: '805051-7', name: 'Honda CB 300F Twister ABS', brand: 'Honda', cat: 'naked' as MotoCategory },
  { code: '831001-2', name: 'Bajaj Dominar 400', brand: 'Bajaj', cat: 'naked' as MotoCategory }
];

export const VehiclesScreen: React.FC<VehiclesScreenProps> = ({
  vehicles,
  onSaveVehicles,
  onResetToDefault,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // Estado para busca na FIPE
  const [isFipeModalOpen, setIsFipeModalOpen] = useState(false);
  const [fipeCodeInput, setFipeCodeInput] = useState('');
  const [fipeCategoryInput, setFipeCategoryInput] = useState<MotoCategory>('street');
  const [fipeLoading, setFipeLoading] = useState(false);
  const [fipeFeedback, setFipeFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Formulário Manual / Edição
  const defaultFormData: Omit<Vehicle, 'id'> = {
    name: '',
    brand: '',
    category: 'street',
    year: 2024,
    price: 18000,
    monthlyFinancing: 480,
    fipeDepreciationYearly: 0.06,
    cityKml: 38,
    highwayKml: 42,
    ipvaRate: 0.02,
    licensingAnnual: 160,
    insuranceAnnual: 1600,
    maintenancePerKm: 0.12,
    comfortScore: 4.0,
    performanceScore: 4.0,
    reliabilityScore: 4.5,
    resaleLiquidityScore: 4.5,
    badge: 'Nova Moto'
  };

  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>(defaultFormData);

  // Filtragem
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingVehicleId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setFormData({
      name: v.name,
      brand: v.brand,
      category: v.category,
      year: v.year,
      price: v.price,
      monthlyFinancing: v.monthlyFinancing,
      fipeDepreciationYearly: v.fipeDepreciationYearly,
      cityKml: v.cityKml,
      highwayKml: v.highwayKml,
      ipvaRate: v.ipvaRate,
      licensingAnnual: v.licensingAnnual,
      insuranceAnnual: v.insuranceAnnual,
      maintenancePerKm: v.maintenancePerKm,
      comfortScore: v.comfortScore,
      performanceScore: v.performanceScore,
      reliabilityScore: v.reliabilityScore,
      resaleLiquidityScore: v.resaleLiquidityScore,
      badge: v.badge || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (vehicles.length <= 2) {
      alert('O modelo TOPSIS necessita de no mínimo 2 alternativas para calcular o ranking.');
      return;
    }
    if (window.confirm('Tem certeza que deseja remover esta moto da base de dados?')) {
      const updated = vehicles.filter(v => v.id !== id);
      onSaveVehicles(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.brand.trim()) {
      alert('Por favor informe Marca e Modelo da moto.');
      return;
    }

    if (editingVehicleId) {
      const updated = vehicles.map(v =>
        v.id === editingVehicleId
          ? { ...formData, id: editingVehicleId }
          : v
      );
      onSaveVehicles(updated);
    } else {
      const newVehicle: Vehicle = {
        ...formData,
        id: `moto-${Date.now()}`
      };
      onSaveVehicles([...vehicles, newVehicle]);
    }
    setIsModalOpen(false);
  };

  // Consulta FIPE via BrasilAPI
  const handleQueryFipe = async (codeToQuery?: string, catToUse?: MotoCategory) => {
    const code = (codeToQuery || fipeCodeInput).trim();
    const category = catToUse || fipeCategoryInput;

    if (!code) {
      setFipeFeedback({ message: 'Digite um código FIPE válido.', isError: true });
      return;
    }

    setFipeLoading(true);
    setFipeFeedback(null);

    try {
      const fipeData = await fetchFipePriceByCode(code);
      if (!fipeData) {
        setFipeFeedback({
          message: 'Código FIPE não encontrado na base pública. Verifique o código e tente novamente.',
          isError: true
        });
        setFipeLoading(false);
        return;
      }

      const numericPrice = parseFipeCurrencyToNumber(fipeData.valor);
      const enriched = generateDefaultOperationalProfile(
        fipeData.marca,
        fipeData.modelo,
        numericPrice,
        category,
        fipeData.anoModelo || 2024
      );

      const cleanCode = code.replace(/\D/g, '');
      const existingIndex = vehicles.findIndex(
        v => v.fipeCode && v.fipeCode.replace(/\D/g, '') === cleanCode
      );

      if (existingIndex >= 0) {
        // Se a moto já existe, atualiza o preço e custos atrelados à FIPE sem duplicar
        const existing = vehicles[existingIndex];
        const updatedVehicle: Vehicle = {
          ...existing,
          price: numericPrice,
          year: fipeData.anoModelo || existing.year,
          monthlyFinancing: Math.round(numericPrice * 0.026),
          insuranceAnnual: Math.round(Math.max(750, Math.min(12000, numericPrice * 0.082))),
          fipeReferenceMonth: fipeData.mesReferencia
        };
        const updatedList = [...vehicles];
        updatedList[existingIndex] = updatedVehicle;
        onSaveVehicles(updatedList);

        setFipeFeedback({
          message: `Atualizado! A motocicleta "${existing.name}" já constava na base e seu preço FIPE foi sincronizado para ${fipeData.valor} (${fipeData.mesReferencia})!`,
          isError: false
        });
      } else {
        // Se for um modelo novo que não estava na base, adiciona
        const newVehicle: Vehicle = {
          ...enriched,
          id: `fipe-${cleanCode}-${Date.now()}`,
          fipeCode: fipeData.codigoFipe,
          fipeReferenceMonth: fipeData.mesReferencia
        };

        onSaveVehicles([...vehicles, newVehicle]);

        setFipeFeedback({
          message: `Sucesso! Nova motocicleta "${fipeData.modelo}" importada da FIPE oficial (${fipeData.valor}) com perfil calibrado!`,
          isError: false
        });
      }
      setFipeCodeInput('');
    } catch (err) {
      setFipeFeedback({
        message: 'Erro ao conectar à API da FIPE. Verifique sua conexão.',
        isError: true
      });
    } finally {
      setFipeLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-800" />
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Base de Dados de Motocicletas
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie o catálogo de alternativas, parâmetros de consumo, FIPE oficial e custos de manutenção do SAD
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFipeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="Consultar preço oficial e importar moto direto da Tabela FIPE"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Importar da FIPE (API)</span>
          </button>

          <button
            onClick={onResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="Restaurar base padrão inicial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Moto</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por marca ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {['all', 'street', 'trail', 'scooter', 'naked', 'custom'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors whitespace-nowrap ${selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {cat === 'all' ? 'Todas' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {v.brand} &bull; {v.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{v.name}</h3>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" /> Preço FIPE
                  </span>
                  <span className="font-semibold text-slate-900">
                    R$ {v.price.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-500" /> Consumo Urbano
                  </span>
                  <span className="font-semibold text-slate-900">
                    {v.cityKml} km/l
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-slate-500" /> Peças / km
                  </span>
                  <span className="font-semibold text-slate-900">
                    R$ {v.maintenancePerKm.toFixed(2)} /km
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-500" /> Seguro Anual
                  </span>
                  <span className="font-semibold text-slate-900">
                    R$ {v.insuranceAnnual.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Qualitative Scores (1 a 5) */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-4 gap-1 text-center">
                <div>
                  <span className="text-[9px] text-slate-400 block">Conforto</span>
                  <span className="text-xs font-bold text-slate-800">{v.comfortScore}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Motor</span>
                  <span className="text-xs font-bold text-slate-800">{v.performanceScore}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Mecânica</span>
                  <span className="text-xs font-bold text-slate-800">{v.reliabilityScore}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Revenda</span>
                  <span className="text-xs font-bold text-slate-800">{v.resaleLiquidityScore}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
              <button
                onClick={() => handleOpenEdit(v)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Editar parâmetros"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(v.id)}
                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Excluir da base"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal FIPE - BrasilAPI */}
      {isFipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Importar Motocicleta via BrasilAPI (FIPE Oficial)
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsFipeModalOpen(false);
                  setFipeFeedback(null);
                }}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Consulte o valor venal oficial diretamente na Tabela FIPE brasileira em tempo real. O SAD complementará automaticamente a moto com a ficha técnica e coeficientes operacionais.
              </p>

              {/* Feedback Alert */}
              {fipeFeedback && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${fipeFeedback.isError
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                  {fipeFeedback.isError ? (
                    <X className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{fipeFeedback.message}</span>
                </div>
              )}

              {/* Form Input FIPE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">
                    Código FIPE (ex: 805047-9)
                  </label>
                  <input
                    type="text"
                    value={fipeCodeInput}
                    onChange={(e) => setFipeCodeInput(e.target.value)}
                    placeholder="Digite o código FIPE..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Categoria
                  </label>
                  <select
                    value={fipeCategoryInput}
                    onChange={(e) => setFipeCategoryInput(e.target.value as MotoCategory)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="street">Street</option>
                    <option value="trail">Trail</option>
                    <option value="scooter">Scooter</option>
                    <option value="naked">Naked</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQueryFipe()}
                disabled={fipeLoading || !fipeCodeInput.trim()}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {fipeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando BrasilAPI...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Consultar e Importar da FIPE</span>
                  </>
                )}
              </button>

              {/* Exemplos Rápidos de Códigos FIPE */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                  Ou clique em um modelo com Código FIPE Oficial já mapeado:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_FIPE_CODES.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => handleQueryFipe(item.code, item.cat)}
                      disabled={fipeLoading}
                      className="p-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-left transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">{item.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">Cód: {item.code}</span>
                      </div>
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                        Importar
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                {editingVehicleId ? 'Editar Parâmetros da Motocicleta' : 'Cadastrar Nova Motocicleta na Base'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ex: Honda, Yamaha"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Nome / Versão do Modelo</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Honda CB 300F Twister ABS"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MotoCategory })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="street">Street</option>
                    <option value="trail">Trail</option>
                    <option value="scooter">Scooter</option>
                    <option value="naked">Naked</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Ano Fabricação</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Preço FIPE (R$)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Parcela Financ. (R$)</label>
                  <input
                    type="number"
                    value={formData.monthlyFinancing}
                    onChange={(e) => setFormData({ ...formData, monthlyFinancing: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Consumo & Custos */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-800 block mb-2">
                  Consumo e Custos Operacionais
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Consumo Cidade (km/l)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.cityKml}
                      onChange={(e) => setFormData({ ...formData, cityKml: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Consumo Estrada (km/l)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.highwayKml}
                      onChange={(e) => setFormData({ ...formData, highwayKml: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Cesta Peças/km (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maintenancePerKm}
                      onChange={(e) => setFormData({ ...formData, maintenancePerKm: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Seguro Anual (R$)</label>
                    <input
                      type="number"
                      value={formData.insuranceAnnual}
                      onChange={(e) => setFormData({ ...formData, insuranceAnnual: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Scores Qualitativos TOPSIS */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-800 block mb-2">
                  Notas de Engenharia e Mercado (Critérios TOPSIS 1 a 5)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Conforto / Suspensão</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.comfortScore}
                      onChange={(e) => setFormData({ ...formData, comfortScore: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Potência Motor</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.performanceScore}
                      onChange={(e) => setFormData({ ...formData, performanceScore: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Mecânica / Peças</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.reliabilityScore}
                      onChange={(e) => setFormData({ ...formData, reliabilityScore: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Liquidez Revenda</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.resaleLiquidityScore}
                      onChange={(e) => setFormData({ ...formData, resaleLiquidityScore: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 shadow-xs"
                >
                  {editingVehicleId ? 'Salvar Alterações' : 'Adicionar à Base'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
