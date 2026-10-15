import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Ban,
  ArrowRight,
  Printer,
  ChevronRight,
  Filter,
  Search,
  Layers,
} from 'lucide-react';
import { ProductionOrder, PcpMetrics, PriorityLevel } from '../types/index.ts';
import { getDeadlineStatus, formatNumber } from '../utils/formatters.ts';

interface DashboardPanelProps {
  orders: ProductionOrder[];
  metrics: PcpMetrics | null;
  onAdvanceStage: (order: ProductionOrder) => void;
  onRequestCancel: (order: ProductionOrder) => void;
  onSelectForPrint: (order: ProductionOrder) => void;
  onOpenDetails: (order: ProductionOrder) => void;
  onOpenNewOp: () => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  orders,
  metrics,
  onAdvanceStage,
  onRequestCancel,
  onSelectForPrint,
  onOpenDetails,
  onOpenNewOp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filtragem dos cards
  const filteredOrders = orders.filter((op) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = op.code.toLowerCase().includes(q);
      const matchProduct = op.productName.toLowerCase().includes(q);
      const matchClient = op.client.toLowerCase().includes(q);
      const matchOrder = op.orderCode ? op.orderCode.toLowerCase().includes(q) : false;
      if (!matchCode && !matchProduct && !matchClient && !matchOrder) return false;
    }
    if (priorityFilter !== 'all' && op.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  // Agrupamentos por coluna do fluxo de chão de fábrica
  const plannedOps = filteredOrders.filter((o) => o.status === 'planejada');
  const waitingMaterialsOps = filteredOrders.filter((o) => o.status === 'aguardando_insumos');
  const inProductionOps = filteredOrders.filter((o) => o.status === 'em_producao');
  const inQualityOps = filteredOrders.filter((o) => o.status === 'controle_qualidade');
  const finishedOrCancelledOps = filteredOrders.filter((o) => o.status === 'concluida' || o.status === 'cancelada');

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgente':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm">Urgente</span>;
      case 'alta':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">Alta</span>;
      case 'media':
        return <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">Média</span>;
      default:
        return <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">Baixa</span>;
    }
  };

  const renderOpCard = (op: ProductionOrder) => {
    const deadlineInfo = getDeadlineStatus(op.deadline, op.status);
    const stages = op.stages || [];
    const completedStages = stages.filter((s) => s.status === 'concluido').length;
    const totalStages = stages.length || 1;
    const progressPercent = Math.round((completedStages / totalStages) * 100);
    const canCancel = op.status !== 'concluida' && op.status !== 'cancelada';

    return (
      <div
        key={op.id}
        className="group relative bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs space-y-3"
      >
        {/* Card Header: Code, Order & Priority */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">
                {op.code}
              </span>
              {op.orderCode && (
                <span className="font-mono text-[11px] text-slate-500">
                  / {op.orderCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[170px]" title={op.client}>
              {op.client}
            </p>
          </div>
          <div>{getPriorityBadge(op.priority)}</div>
        </div>

        {/* Product details */}
        <div>
          <button
            onClick={() => onOpenDetails(op)}
            className="text-left text-xs font-semibold text-slate-800 hover:text-slate-900 line-clamp-2 transition-colors cursor-pointer"
          >
            {op.productName}
          </button>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span className="font-mono text-slate-700 font-medium">
              {formatNumber(op.quantity)} {op.unit}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{op.currentSector}</span>
          </div>
        </div>

        {/* Progress of Stages */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500">
              Etapa {Math.min(op.currentStageIndex + 1, totalStages)} de {totalStages}
            </span>
            <span className="font-mono text-slate-600 font-medium">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                op.status === 'cancelada'
                  ? 'bg-rose-500'
                  : op.status === 'concluida'
                  ? 'bg-emerald-600'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${op.status === 'cancelada' ? 100 : progressPercent}%` }}
            />
          </div>
        </div>

        {/* Deadline information formatted with centralized formatters */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500 font-mono">
            {deadlineInfo.formattedDate}
          </span>
          <span className={`px-2 py-0.5 rounded-sm font-medium ${deadlineInfo.badgeClass}`}>
            {deadlineInfo.label}
          </span>
        </div>

        {/* Cancelled notes if applicable */}
        {op.status === 'cancelada' && op.cancelReason && (
          <div className="p-2 bg-rose-50/60 border border-rose-200/60 rounded-md text-[11px] text-rose-800">
            <span className="font-semibold">Cancelado:</span> {op.cancelReason}
          </div>
        )}

        {/* Card Actions: Quick Advance, Cancel and Print A4 */}
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectForPrint(op)}
              title="Visualizar e Imprimir Ficha A4"
              aria-label={`Imprimir Ficha A4 da ordem ${op.code}`}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onOpenDetails(op)}
              title="Ver detalhes da OP"
              aria-label={`Ver detalhes da ordem ${op.code}`}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* AÇÃO PRINCIPAL SOLICITADA: Cancelar Ordem diretamente no painel em tempo real */}
            {canCancel && (
              <button
                onClick={() => onRequestCancel(op)}
                title="Cancelar esta Ordem de Produção"
                className="px-2 py-1 text-[11px] font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-md transition-all flex items-center gap-1"
              >
                <Ban className="w-3 h-3" />
                Cancelar
              </button>
            )}

            {/* Avançar Etapa se não concluída ou cancelada */}
            {canCancel && (
              <button
                onClick={() => onAdvanceStage(op)}
                title={
                  op.status === 'planejada' || op.status === 'aguardando_insumos'
                    ? 'Iniciar execução da ordem na primeira etapa'
                    : op.currentStageIndex >= totalStages - 1
                    ? 'Concluir todas as etapas e finalizar ordem'
                    : 'Avançar para a próxima etapa produtiva'
                }
                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-md transition-all flex items-center gap-1 shadow-2xs"
              >
                <span>
                  {op.status === 'planejada' || op.status === 'aguardando_insumos'
                    ? 'Iniciar'
                    : op.currentStageIndex >= totalStages - 1
                    ? 'Concluir'
                    : 'Avançar'}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Metrics Header strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total de OPs</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {metrics ? metrics.totalOps : orders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Todas cadastradas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Em Produção</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700">
            {metrics ? metrics.inProgressOps : inProductionOps.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Chão de fábrica ativo</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>No Prazo</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {metrics ? metrics.onTimeCount : 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Dentro do cronograma</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Em Atraso</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold font-mono text-red-700">
            {metrics ? metrics.overdueCount : 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Exigem reprogramação</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Taxa OTD</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {metrics ? `${metrics.otdPercentage}%` : '96.2%'}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Meta: $\ge 95\%$</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Refugo PPM</span>
            <span className="font-mono text-[10px] text-slate-400">Qualidade</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {metrics ? metrics.scrapPpm : 450}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Padrão ISO 9001</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por OP (ex: OP-2026-001), Pedido, Produto ou Cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Prioridade:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'urgente', label: 'Urgente' },
              { id: 'alta', label: 'Alta' },
              { id: 'media', label: 'Média' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPriorityFilter(p.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                  priorityFilter === p.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Tracking Kanban Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {/* Coluna 1: Planejadas */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 space-y-3 min-h-[460px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Planejada
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {plannedOps.length}
            </span>
          </div>
          <div className="space-y-3">
            {plannedOps.map((op) => renderOpCard(op))}
            {plannedOps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhuma ordem planejada</p>
            )}
          </div>
        </div>

        {/* Coluna 2: Aguardando Insumos */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 space-y-3 min-h-[460px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Aguardando Insumos
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {waitingMaterialsOps.length}
            </span>
          </div>
          <div className="space-y-3">
            {waitingMaterialsOps.map((op) => renderOpCard(op))}
            {waitingMaterialsOps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Almoxarifado em dia</p>
            )}
          </div>
        </div>

        {/* Coluna 3: Em Produção */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 space-y-3 min-h-[460px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Em Produção
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {inProductionOps.length}
            </span>
          </div>
          <div className="space-y-3">
            {inProductionOps.map((op) => renderOpCard(op))}
            {inProductionOps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhuma ordem em máquina</p>
            )}
          </div>
        </div>

        {/* Coluna 4: Controle de Qualidade */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 space-y-3 min-h-[460px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Inspeção CQ
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {inQualityOps.length}
            </span>
          </div>
          <div className="space-y-3">
            {inQualityOps.map((op) => renderOpCard(op))}
            {inQualityOps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Fila de CQ liberada</p>
            )}
          </div>
        </div>

        {/* Coluna 5: Concluídas / Canceladas */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 space-y-3 min-h-[460px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Finalizadas
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {finishedOrCancelledOps.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {finishedOrCancelledOps.map((op) => renderOpCard(op))}
            {finishedOrCancelledOps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhuma finalizada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
