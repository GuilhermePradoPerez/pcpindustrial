import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Printer,
  ChevronRight,
  Trash2,
  Ban,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { ProductionOrder, ProductionStatus } from '../types/index.ts';
import { formatDate, getDeadlineStatus, getOpStatusMeta, formatNumber } from '../utils/formatters.ts';

interface ProductionOrdersViewProps {
  orders: ProductionOrder[];
  onOpenNewOp: () => void;
  onAdvanceStage: (order: ProductionOrder) => void;
  onRequestCancel: (order: ProductionOrder) => void;
  onSelectForPrint: (order: ProductionOrder) => void;
  onDeleteOrder: (order: ProductionOrder) => void;
  onOpenDetails: (order: ProductionOrder) => void;
}

export const ProductionOrdersView: React.FC<ProductionOrdersViewProps> = ({
  orders,
  onOpenNewOp,
  onAdvanceStage,
  onRequestCancel,
  onSelectForPrint,
  onDeleteOrder,
  onOpenDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((op) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = op.code.toLowerCase().includes(q);
      const matchProduct = op.productName.toLowerCase().includes(q);
      const matchClient = op.client.toLowerCase().includes(q);
      const matchOrder = op.orderCode ? op.orderCode.toLowerCase().includes(q) : false;
      if (!matchCode && !matchProduct && !matchClient && !matchOrder) return false;
    }
    if (statusFilter !== 'all' && op.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header Actions and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Ordens de Produção (OP)
          </h2>
          <p className="text-xs text-slate-500">
            Rastreabilidade completa, apontamentos de chão de fábrica e roteiro técnico
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewOp}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nova Ordem de Produção
          </button>
        </div>
      </div>

      {/* Search and Status Filter Row */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por OP, Pedido, Produto ou Cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[
            { id: 'all', label: 'Todas' },
            { id: 'planejada', label: 'Planejadas' },
            { id: 'aguardando_insumos', label: 'Aguardando' },
            { id: 'em_producao', label: 'Em Produção' },
            { id: 'controle_qualidade', label: 'Em Qualidade' },
            { id: 'concluida', label: 'Concluídas' },
            { id: 'cancelada', label: 'Canceladas' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Production Orders Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Código / Pedido</th>
                <th className="py-3 px-4">Produto & Especificação</th>
                <th className="py-3 px-4 text-right">Qtd</th>
                <th className="py-3 px-4">Cliente / Destino</th>
                <th className="py-3 px-4">Setor & Etapa</th>
                <th className="py-3 px-4">Início</th>
                <th className="py-3 px-4">Prazo de Entrega</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((op) => {
                const deadlineInfo = getDeadlineStatus(op.deadline, op.status);
                const statusMeta = getOpStatusMeta(op.status);
                const canCancel = op.status !== 'concluida' && op.status !== 'cancelada';
                const stages = op.stages || [];
                const totalStages = stages.length || 1;
                const completedStages = stages.filter((s) => s.status === 'concluido').length;

                return (
                  <tr
                    key={op.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Código / Pedido */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">
                        {op.code}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {op.orderCode || 'Sem pedido'}
                      </div>
                    </td>

                    {/* Produto */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onOpenDetails(op)}
                        className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer max-w-[220px] truncate block"
                      >
                        {op.productName}
                      </button>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                        <span>{op.productSku}</span>
                        <span aria-hidden="true">·</span>
                        <span>{op.drawingRef}</span>
                      </div>
                    </td>

                    {/* Quantidade */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap font-medium text-slate-900">
                      {formatNumber(op.quantity)} {op.unit}
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4 text-slate-700 max-w-[150px] truncate">
                      {op.client}
                    </td>

                    {/* Setor & Progresso de Etapa */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 text-[11px]">
                        {op.currentSector}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{completedStages}/{totalStages} etapas</span>
                        <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden inline-block">
                          <div
                            className="bg-slate-700 h-full"
                            style={{ width: `${(completedStages / totalStages) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Início */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {formatDate(op.startDate)}
                    </td>

                    {/* Prazo de Entrega com utilitário seguro */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-[11px] text-slate-900">
                        {deadlineInfo.formattedDate}
                      </div>
                      <div className={`text-[10px] mt-0.5 font-medium ${deadlineInfo.textClass}`}>
                        {deadlineInfo.label}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Imprimir Ficha A4 */}
                        <button
                          onClick={() => onSelectForPrint(op)}
                          title="Imprimir Ficha de Produção A4"
                          aria-label={`Imprimir ficha da ordem ${op.code}`}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Detalhes */}
                        <button
                          onClick={() => onOpenDetails(op)}
                          title="Ver detalhes da OP"
                          aria-label={`Ver detalhes da ordem ${op.code}`}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Avançar Etapa se não concluída ou cancelada */}
                        {canCancel && (
                          <button
                            onClick={() => onAdvanceStage(op)}
                            title="Avançar etapa produtiva"
                            aria-label={`Avançar etapa da ordem ${op.code}`}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* AÇÃO SOLICITADA: Cancelar Ordem */}
                        {canCancel && (
                          <button
                            onClick={() => onRequestCancel(op)}
                            title="Cancelar Ordem de Produção"
                            aria-label={`Cancelar ordem ${op.code}`}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Excluir OP */}
                        <button
                          onClick={() => onDeleteOrder(op)}
                          title="Excluir Ordem (preserva numeração sequencial futura)"
                          aria-label={`Excluir ordem ${op.code}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    Nenhuma Ordem de Produção encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
