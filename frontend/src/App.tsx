import React, { useState, useEffect } from 'react';
import {
  ActiveScreen,
  UserUsageProfile,
  CriteriaWeights,
  Vehicle,
  SimulationResponse
} from './types';
import { officialFipeCatalog } from './data/officialFipeCatalog';
import {
  simulateDecision,
  simulateDecisionSync,
  fetchVehiclesFromBackend
} from './services/decisionApi';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { SimulationScreen } from './components/SimulationScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { VehiclesScreen } from './components/VehiclesScreen';

export function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('login');
  const [userEmail, setUserEmail] = useState('test@qualmoto.com.br');

  // Estado dinâmico da base de veículos (persistido em localStorage)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem('qualmoto_vehicles_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(v => v.category !== ('eletrica' as any));
          if (cleaned.length === officialFipeCatalog.length) {
            return cleaned;
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar veículos do localStorage:', e);
    }
    return officialFipeCatalog;
  });

  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Ao montar, tenta sincronizar os veículos direto da API do NestJS
  useEffect(() => {
    let isMounted = true;
    fetchVehiclesFromBackend().then((apiVehicles) => {
      if (isMounted && apiVehicles && apiVehicles.length > 0) {
        setVehicles(apiVehicles);
        setIsBackendConnected(true);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleSaveVehicles = (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    try {
      localStorage.setItem('qualmoto_vehicles_db', JSON.stringify(newVehicles));
    } catch (e) {
      console.warn('Erro ao salvar veículos no localStorage:', e);
    }
  };

  const handleResetVehicles = () => {
    if (window.confirm('Deseja restaurar a base de motocicletas para o padrão oficial da FIPE?')) {
      setVehicles(officialFipeCatalog);
      localStorage.removeItem('qualmoto_vehicles_db');
    }
  };

  // Parâmetros de Uso ajustados para Motocicletas
  const [profile, setProfile] = useState<UserUsageProfile>({
    monthlyKm: 1000,
    cityRatio: 0.80,
    fuelPriceGasoline: 5.89,
    fuelPriceEthanol: 3.99,
    budgetLimitMonthly: 900,
    isFinanced: true,
    downPayment: 5000
  });

  // Pesos de Decisão Multicritério (TOPSIS)
  const [weights, setWeights] = useState<CriteriaWeights>({
    economy: 35,
    comfort: 20,
    performance: 15,
    reliability: 20,
    resale: 10
  });

  // Estado da simulação e clusterização por grupos batizados (NestJS API + Fallback)
  const [simulationData, setSimulationData] = useState<SimulationResponse>(() => {
    return simulateDecisionSync(vehicles, profile, weights);
  });

  useEffect(() => {
    let isMounted = true;
    simulateDecision(profile, weights, vehicles).then(({ data, isFromBackend }) => {
      if (isMounted) {
        setSimulationData(data);
        setIsBackendConnected(isFromBackend);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [vehicles, profile, weights]);

  // Se a tela ativa for login
  if (activeScreen === 'login') {
    return (
      <LoginScreen
        onLogin={(email) => {
          setUserEmail(email);
          setActiveScreen('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* Top Navbar */}
      <Navbar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        userEmail={userEmail}
        onLogout={() => setActiveScreen('login')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeScreen === 'dashboard' && (
          <DashboardScreen
            simulationData={simulationData}
            profile={profile}
            onNavigateToSimulation={() => setActiveScreen('simulation')}
            onNavigateToReports={() => setActiveScreen('reports')}
          />
        )}

        {activeScreen === 'simulation' && (
          <SimulationScreen
            simulationData={simulationData}
            profile={profile}
            setProfile={setProfile}
            weights={weights}
            setWeights={setWeights}
          />
        )}

        {activeScreen === 'reports' && (
          <ReportsScreen
            simulationData={simulationData}
            profile={profile}
            weights={weights}
            userEmail={userEmail}
          />
        )}

        {activeScreen === 'vehicles' && (
          <VehiclesScreen
            vehicles={vehicles}
            onSaveVehicles={handleSaveVehicles}
            onResetToDefault={handleResetVehicles}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <p>QualMoto? &bull; Sistema de Apoio à Decisão para Escolha e Substituição de Motocicletas</p>
      </footer>

    </div>
  );
}

export default App;
