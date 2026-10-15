import React, { useState } from 'react';
import { AlertTriangle, X, Ban } from 'lucide-react';
import { ProductionOrder } from '../types/index.ts';
import { formatDate } from '../utils/formatters.ts';

interface CancelOrderModalProps {
  order: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string; notes: string; cancelledBy: string }) => Promise<void>;
}

const CANCELLATION_REASONS = [
  'Cancelamento solicitado pelo cliente',
  'Ruptura de estoque / Falta de matéria-prima',
  'Alteração de projeto / Revisão de engenharia',
  'Manutenção corretiva emergencial na máquina',
  'Falha dimensional / Não conformidade irrecuperável',
  'Reprogramação estratégica do PCP',
  'Outro motivo operacional',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [cancelledBy, setCancelledBy] = useState('Eng. Roberto Faria (PCP)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm({
        reason,
        notes,
        cancelledBy,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cancelar ordem';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cancelar Ordem de Produção
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {order.code} · {order.productSku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Context box */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Produto:</span>
              <span className="font-semibold text-slate-900">{order.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Quantidade:</span>
              <span className="font-mono font-medium">{order.quantity} {order.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span>{order.client}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Prazo Estipulado:</span>
              <span className="font-mono">{formatDate(order.deadline)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Etapa Atual:</span>
              <span className="font-medium text-amber-700">{order.currentSector}</span>
            </div>
          </div>

          <div className="text-xs text-slate-600">
            Atenção: Ao cancelar esta Ordem de Produção, todas as operações no chão de fábrica serão
            interrompidas e os insumos alocados serão liberados para devolução ao almoxarifado.
          </div>

          {/* Motivo do Cancelamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo do Cancelamento <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              required
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável pelo Cancelamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsável pelo Cancelamento
            </label>
            <input
              type="text"
              value={cancelledBy}
              onChange={(e) => setCancelledBy(e.target.value)}
              placeholder="Nome ou matrícula do engenheiro/operador"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              required
            />
          </div>

          {/* Justificativa / Observações adicionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Técnicas / Justificativa
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva detalhadamente o ocorrido para registro no histórico da OP..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
