import React from 'react';
import { ActiveScreen } from '../types';
import { 
  BarChart2, 
  SlidersHorizontal, 
  FileText, 
  Database,
  LogOut,
  Motorbike
} from 'lucide-react';

interface NavbarProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  userEmail?: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  setActiveScreen,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Product Name */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer select-none" 
            onClick={() => setActiveScreen('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Motorbike className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight text-slate-900">QualMoto?</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveScreen('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeScreen === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveScreen('simulation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeScreen === 'simulation'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Simulação</span>
            </button>

            <button
              onClick={() => setActiveScreen('reports')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeScreen === 'reports'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Relatório</span>
            </button>

            <button
              onClick={() => setActiveScreen('vehicles')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeScreen === 'vehicles'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Base de Motos</span>
            </button>
          </nav>

          {/* Right Controls: Logout */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onLogout}
              title="Sair"
              className="flex items-center space-x-1.5 py-1 px-2.5 rounded-lg text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
