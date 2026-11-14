import { Vehicle, UserUsageProfile, CalculatedTCO } from '../types';

/**
 * FUNÇÃO ANALÍTICA 1: SUMARIZAÇÃO
 * Calcula o Total Cost of Ownership (TCO) e Custo por Km Rodado
 */
export function calculateVehicleTCO(
  vehicle: Vehicle,
  profile: UserUsageProfile
): CalculatedTCO {
  const { monthlyKm, cityRatio, fuelPriceGasoline, isFinanced } = profile;

  // 1. Consumo Ponderado de Combustível (Litros/km)
  // Fórmula harmônica de consumo misto urbano/estrada
  const highwayRatio = Math.max(0, 1 - cityRatio);
  const litersPerKm = (cityRatio / vehicle.cityKml) + (highwayRatio / vehicle.highwayKml);
  const monthlyLiters = monthlyKm * litersPerKm;
  const monthlyFuelCost = monthlyLiters * fuelPriceGasoline;

  // 2. Custos Fixos Rateados Mensalmente (IPVA + Seguro + Licenciamento)
  const annualIpva = vehicle.price * vehicle.ipvaRate;
  const annualFixed = annualIpva + vehicle.insuranceAnnual + vehicle.licensingAnnual;
  const monthlyFixedCost = annualFixed / 12;

  // 3. Provisão de Manutenção por Desgaste de Quilometragem
  const monthlyMaintenanceCost = vehicle.maintenancePerKm * monthlyKm;

  // 4. Depreciação Mensal Estimada (Curva Histórica FIPE)
  const annualDepreciation = vehicle.price * vehicle.fipeDepreciationYearly;
  const monthlyDepreciationCost = annualDepreciation / 12;

  // 5. Custo de Aquisição: Financiamento vs Custo de Oportunidade do Capital
  // Se quitado/à vista, considera custo de oportunidade de 0.8% a.m. (Selic líquida aproximada)
  const monthlyCapitalOrFinancing = isFinanced
    ? vehicle.monthlyFinancing
    : (vehicle.price * 0.008);

  // Totalização
  const totalMonthlyTCO = 
    monthlyCapitalOrFinancing +
    monthlyFixedCost +
    monthlyFuelCost +
    monthlyMaintenanceCost +
    monthlyDepreciationCost;

  const totalAnnualTCO = totalMonthlyTCO * 12;
  const costPerKm = monthlyKm > 0 ? totalMonthlyTCO / monthlyKm : 0;

  return {
    vehicleId: vehicle.id,
    monthlyFuelCost: Math.round(monthlyFuelCost),
    monthlyFixedCost: Math.round(monthlyFixedCost),
    monthlyMaintenanceCost: Math.round(monthlyMaintenanceCost),
    monthlyDepreciationCost: Math.round(monthlyDepreciationCost),
    monthlyCapitalOrFinancing: Math.round(monthlyCapitalOrFinancing),
    totalMonthlyTCO: Math.round(totalMonthlyTCO),
    totalAnnualTCO: Math.round(totalAnnualTCO),
    costPerKm: Number(costPerKm.toFixed(2))
  };
}
