import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { Product, SalesOrder, PriorityLevel } from '../types/index.ts';
import { fetchNextNumbers } from '../services/api.ts';
import { formatDateForInput } from '../utils/formatters.ts';

interface NewOpModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: SalesOrder[];
  onSubmit: (newOpData: Record<string, unknown>) => Promise<void>;
  initialOrderCode?: string | null;
}

export const NewOpModal: React.FC<NewOpModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  onSubmit,
  initialOrderCode,
}) => {
  const [opCode, setOpCode] = useState('');
  const [suggestedOpCode, setSuggestedOpCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedOrderCode, setSelectedOrderCode] = useState(initialOrderCode || '');
  const [quantity, setQuantity] = useState(50);
  const [client, setClient] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('alta');
  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
  const [deadline, setDeadline] = useState(formatDateForInput(new Date(Date.now() + 7 * 86400000)));
  const [responsibleOperator, setResponsibleOperator] = useState('Eng. Roberto Faria (PCP)');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carregar sugestão precisa do próximo código a partir do backend
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCode(true);
      setErrorMessage(null);
      fetchNextNumbers()
        .then((data) => {
          setSuggestedOpCode(data.nextOpNumber);
          setOpCode(data.nextOpNumber);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setIsLoadingCode(false);
        });

      if (products.length > 0 && !selectedProductId) {
        setSelectedProductId(products[0].id);
      }
      if (initialOrderCode) {
        setSelectedOrderCode(initialOrderCode);
      } else {
        setSelectedOrderCode('');
      }
    }
  }, [isOpen, products, selectedProductId, initialOrderCode]);

  // Se vincular a um pedido existente, pré-preencher dados
  useEffect(() => {
    if (selectedOrderCode) {
      const order = orders.find((o) => o.orderCode === selectedOrderCode);
      if (order) {
        setClient(order.client);
        setQuantity(order.quantity);
        setDeadline(formatDateForInput(order.deliveryDate));
        const matchedProd = products.find((p) => p.sku === order.productSku || p.id === order.productId);
        if (matchedProd) {
          setSelectedProductId(matchedProd.id);
        }
      }
    }
  }, [selectedOrderCode, orders, products]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (!currentProduct) {
        throw new Error('Selecione um produto de manufatura válido.');
      }

      // Montar etapas padrão com base na engenharia do produto
      const stages = (currentProduct.defaultStages || []).map((stg, idx) => ({
        id: `stg-${Date.now()}-${idx + 1}`,
        name: stg.name,
        workCenter: stg.workCenter,
        standardMinutes: stg.standardMinutes,
        status: idx === 0 ? 'pendente' : 'pendente',
      }));

      // Montar lista de materiais (BOM)
      const materials = (currentProduct.defaultMaterials || []).map((m, idx) => ({
        id: `mat-${Date.now()}-${idx + 1}`,
        name: m.name,
        sku: m.sku,
        requiredQuantity: Number((m.requiredQuantity * quantity).toFixed(2)),
        unit: m.unit,
        allocated: true,
      }));

      await onSubmit({
        code: opCode.trim().toUpperCase(),
        orderCode: selectedOrderCode ? selectedOrderCode.trim().toUpperCase() : null,
        productId: currentProduct.id,
        productName: currentProduct.name,
        productSku: currentProduct.sku,
        drawingRef: currentProduct.drawingNumber,
        quantity: Number(quantity),
        unit: currentProduct.unit,
        client: client || (selectedOrderCode ? 'Cliente do Pedido' : 'Produção para Estoque'),
        priority,
        status: 'planejada',
        currentSector: stages[0]?.workCenter || 'PCP / Engenharia',
        currentStageIndex: 0,
        stages,
        startDate,
        deadline,
        responsibleOperator,
        technicalNotes,
        materials,
      });

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar Ordem de Produção';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Abertura de Ordem de Produção (OP)
              </h2>
              <p className="text-xs text-slate-500">
                Geração sequencial com garantia de unicidade (OP-2026-XXX)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Campo de Código da OP com indicação do cálculo sequencial */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Código da Ordem (OP)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sequencial: {suggestedOpCode || '...'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={opCode}
                onChange={(e) => setOpCode(e.target.value.toUpperCase())}
                placeholder="OP-2026-001"
                required
                className="w-full text-sm font-mono font-bold tracking-wider px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setOpCode(suggestedOpCode)}
                disabled={isLoadingCode || !suggestedOpCode}
                className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-100 whitespace-nowrap transition-colors"
              >
                Aplicar Sugestão
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Índice extraído pelo maior sequencial numérico ativo ou histórico, prevenindo colisões de chave UNIQUE mesmo após exclusões.
            </p>
          </div>

          {/* Grid de Produto e Pedido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Produto a Fabricar <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vincular a Pedido de Venda (Opcional)
              </label>
              <select
                value={selectedOrderCode}
                onChange={(e) => setSelectedOrderCode(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              >
                <option value="">Sem vínculo (Ordem para Estoque / Reposição)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.orderCode}>
                    {o.orderCode} · {o.client} ({o.quantity} un)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantidade, Cliente e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade Programada <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  required
                />
                <span className="text-xs font-mono text-slate-500 px-2 py-2 bg-slate-100 rounded-md border border-slate-200">
                  {currentProduct?.unit || 'un'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente / Destino
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ex: Petrobras, WEG, Estoque..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nível de Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Datas com utilitário seguro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Início Prevista <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  required
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prazo Limite de Entrega (Deadline) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  required
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Responsável e Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Engenheiro / Operador Responsável
              </label>
              <input
                type="text"
                value={responsibleOperator}
                onChange={(e) => setResponsibleOperator(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Desenho Técnico de Referência
              </label>
              <input
                type="text"
                value={currentProduct?.drawingNumber || 'DWG-STD'}
                readOnly
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-700 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Técnicas para o Chão de Fábrica
            </label>
            <textarea
              rows={2}
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              placeholder="Ex: Tolerâncias especiais, certificação de matéria-prima, cuidados no desbaste..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Gerando OP...' : 'Abrir Ordem de Produção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
