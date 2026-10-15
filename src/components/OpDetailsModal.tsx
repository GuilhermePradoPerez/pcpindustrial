import React from 'react';
import {
  X,
  Printer,
  Ban,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  User,
  ShieldCheck,
} from 'lucide-react';
import { ProductionOrder } from '../types/index.ts';
import { formatDate, getDeadlineStatus, getOpStatusMeta, formatNumber } from '../utils/formatters.ts';

interface OpDetailsModalProps {
  order: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceStage: (order: ProductionOrder) => void;
  onRequestCancel: (order: ProductionOrder) => void;
  onSelectForPrint: (order: ProductionOrder) => void;
}

export const OpDetailsModal: React.FC<OpDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onAdvanceStage,
  onRequestCancel,
  onSelectForPrint,
}) => {
  if (!isOpen || !order) return null;

  const deadlineInfo = getDeadlineStatus(order.deadline, order.status);
  const statusMeta = getOpStatusMeta(order.status);
  const canCancel = order.status !== 'concluida' && order.status !== 'cancelada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-slate-900">
                  {order.code}
                </h2>
                <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {order.orderCode ? `Vinculada ao Pedido ${order.orderCode}` : 'Produção Programada para Estoque'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Identificação e prazos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Produto</span>
              <span className="font-bold text-slate-900">{order.productName}</span>
              <span className="text-[11px] font-mono text-slate-500 block">{order.productSku}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Quantidade</span>
              <span className="font-bold font-mono text-slate-900">
                {formatNumber(order.quantity)} {order.unit}
              </span>
              <span className="text-[11px] text-slate-500 block">Ref: {order.drawingRef}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Data Início</span>
              <span className="font-mono text-slate-800">{formatDate(order.startDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Prazo (Deadline)</span>
              <span className="font-mono font-bold text-slate-900">{deadlineInfo.formattedDate}</span>
              <span className={`text-[10px] block font-medium ${deadlineInfo.textClass}`}>
                {deadlineInfo.label}
              </span>
            </div>
          </div>

          {/* Se cancelada, exibe destaque do cancelamento */}
          {order.status === 'cancelada' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <Ban className="w-4 h-4" />
                <span>Ordem Cancelada</span>
              </div>
              <p className="text-rose-700">
                <span className="font-semibold">Motivo:</span> {order.cancelReason}
              </p>
              {order.cancelNotes && (
                <p className="text-rose-600 text-[11px]">
                  <span className="font-semibold">Observações:</span> {order.cancelNotes}
                </p>
              )}
              <div className="text-[10px] text-rose-500 pt-1 font-mono">
                Registrado por {order.cancelledBy || 'Operador'} em {formatDate(order.cancelledAt)}
              </div>
            </div>
          )}

          {/* Roteiro de Produção / Etapas */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>Roteiro de Operações de Fábrica</span>
              <span className="font-mono text-[11px] text-slate-500 font-normal">
                {order.stages.filter((s) => s.status === 'concluido').length} de {order.stages.length} concluídas
              </span>
            </h3>

            <div className="space-y-2 border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
              {order.stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className={`p-3 flex items-center justify-between transition-colors ${
                    idx === order.currentStageIndex && order.status !== 'concluida' && order.status !== 'cancelada'
                      ? 'bg-blue-50/50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 w-5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{stage.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {stage.workCenter} · Padrão: {stage.standardMinutes} min
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {stage.status === 'concluido' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluída
                      </span>
                    ) : idx === order.currentStageIndex && order.status !== 'cancelada' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                        <Clock className="w-3 h-3" />
                        Em Execução
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Pendente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Materiais Insumos */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2">Materiais Alocados (BOM)</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Descrição do Material</th>
                    <th className="py-2 px-3 text-right">Qtd</th>
                    <th className="py-2 px-3">Lote Almoxarifado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.materials.map((mat) => (
                    <tr key={mat.id}>
                      <td className="py-2 px-3 font-mono">{mat.sku}</td>
                      <td className="py-2 px-3">{mat.name}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {mat.requiredQuantity} {mat.unit}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {mat.batchNumber || 'LT-ALMOX-PCP'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectForPrint(order);
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ficha A4
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                onClick={() => {
                  onRequestCancel(order);
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-lg transition-all flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                Cancelar Ordem
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => {
                  onAdvanceStage(order);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>
                  {order.status === 'planejada' || order.status === 'aguardando_insumos'
                    ? 'Iniciar Produção'
                    : order.currentStageIndex >= order.stages.length - 1
                    ? 'Concluir Ordem'
                    : 'Avançar Etapa'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
