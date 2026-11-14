import React, { useState } from 'react';
import { ArrowRight, Lock, User, AlertCircle, Motorbike } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();

    if (cleanUser === 'test' && password === 'test123') {
      setError(null);
      onLogin('test@qualmoto.com.br');
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white shadow-md mb-3">
          <Motorbike className="w-6 h-6 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          QualMoto?
        </h1>
        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
          Sistema de Apoio à Decisão para Escolha e Substituição de Motocicletas
        </p>
      </div>

      {/* Form Container */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200 shadow-sm">
          
          <div className="mb-5 pb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Acesso ao Painel Decisório</h2>
            <p className="text-[11px] text-slate-500">Informe suas credenciais para continuar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Login / Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer mt-2 shadow-xs"
            >
              <span>Entrar no Sistema</span>
              <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            <p>Sistema de Apoio à Decisão &bull; TCO &bull; TOPSIS &bull; PBEV &bull; FIPE</p>
          </div>

        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          QualMoto? &bull; 2026
        </p>
      </div>
    </div>
  );
};
