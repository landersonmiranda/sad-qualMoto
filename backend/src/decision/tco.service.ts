import { Injectable } from '@nestjs/common';
import { Vehicle, UserUsageProfile, CalculatedTCO } from '../common/types';

@Injectable()
export class TcoService {
  calculate(vehicle: Vehicle, profile: UserUsageProfile): CalculatedTCO {
    // 1. Consumo Médio Harmônico ponderado Cidade / Estrada
    const cityWeight = profile.cityRatio;
    const highwayWeight = 1 - profile.cityRatio;
    const harmonicKml = 1 / ((cityWeight / vehicle.cityKml) + (highwayWeight / vehicle.highwayKml));
    
    // Litros mensais consumidos
    const litersMonthly = profile.monthlyKm / harmonicKml;
    const monthlyFuelCost = litersMonthly * profile.fuelPriceGasoline;

    // 2. Custos Fixos Anualizados Rateados Mensalmente
    const ipvaAnnual = vehicle.price * vehicle.ipvaRate;
    const monthlyFixedCost = (ipvaAnnual + vehicle.insuranceAnnual + vehicle.licensingAnnual) / 12;

    // 3. Manutenção e Peças de Desgaste por km
    const monthlyMaintenanceCost = profile.monthlyKm * vehicle.maintenancePerKm;

    // 4. Depreciação Anual FIPE Rateada Mensalmente
    const monthlyDepreciationCost = (vehicle.price * vehicle.fipeDepreciationYearly) / 12;

    // 5. Parcela de Capital / Financiamento
    const monthlyCapitalOrFinancing = profile.isFinanced ? vehicle.monthlyFinancing : 0;

    // TCO Total Mensal e Anual
    const totalMonthlyTCO = monthlyFuelCost + monthlyFixedCost + monthlyMaintenanceCost + monthlyDepreciationCost + monthlyCapitalOrFinancing;
    const totalAnnualTCO = totalMonthlyTCO * 12;
    const costPerKm = profile.monthlyKm > 0 ? totalMonthlyTCO / profile.monthlyKm : 0;

    return {
      vehicleId: vehicle.id,
      monthlyFuelCost,
      monthlyFixedCost,
      monthlyMaintenanceCost,
      monthlyDepreciationCost,
      monthlyCapitalOrFinancing,
      totalMonthlyTCO,
      totalAnnualTCO,
      costPerKm,
    };
  }
}

