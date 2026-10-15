import React from 'react';
import { Factory, Plus, RefreshCw, BarChart3, ClipboardList, ShoppingCart, Printer } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'orders' | 'production' | 'print' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'orders' | 'production' | 'print' | 'reports') => void;
  onOpenNewOp: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOp,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Factory className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              PCP Industrial
            </span>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Painel
            </button>

            <button
              onClick={() => setActiveTab('production')}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'production'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-slate-500" />
              Ordens de Produção
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-slate-500" />
              Pedidos
            </button>

            <button
              onClick={() => setActiveTab('print')}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'print'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Ficha A4
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Relatórios
            </button>
          </nav>

          {/* Zone 3: 1 primary action button + refresh */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onRefresh}
              title="Atualizar dados em tempo real"
              aria-label="Atualizar dados"
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-700' : ''}`} />
            </button>

            <button
              onClick={onOpenNewOp}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nova Ordem de Produção
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1.5 px-2 font-medium ${activeTab === 'dashboard' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-500'}`}
          >
            Painel
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`py-1.5 px-2 font-medium ${activeTab === 'production' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-500'}`}
          >
            OPs
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-1.5 px-2 font-medium ${activeTab === 'orders' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-500'}`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`py-1.5 px-2 font-medium ${activeTab === 'print' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-500'}`}
          >
            Ficha A4
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-1.5 px-2 font-medium ${activeTab === 'reports' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : 'text-slate-500'}`}
          >
            Relatórios
          </button>
        </div>
      </div>
    </header>
  );
};
