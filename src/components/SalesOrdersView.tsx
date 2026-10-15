import React, { useState } from 'react';
import {
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Layers,
  ArrowRight,
  Sparkles,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SalesOrder, Product } from '../types/index.ts';
import { formatDate, formatCurrency, formatNumber, formatDateForInput } from '../utils/formatters.ts';
import { fetchNextNumbers } from '../services/api.ts';

interface SalesOrdersViewProps {
  orders: SalesOrder[];
  products: Product[];
  onCreateOrder: (orderData: Partial<SalesOrder>) => Promise<void>;
  onDeleteOrder: (order: SalesOrder) => void;
  onGenerateOpFromOrder: (order: SalesOrder) => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  orders,
  products,
  onCreateOrder,
  onDeleteOrder,
  onGenerateOpFromOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for new order
  const [orderCode, setOrderCode] = useState('');
  const [suggestedCode, setSuggestedCode] = useState('');
  const [client, setClient] = useState('');
  const [clientDocument, setClientDocument] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(30);
  const [unitPrice, setUnitPrice] = useState(320);
  const [orderDate, setOrderDate] = useState(formatDateForInput(new Date()));
  const [deliveryDate, setDeliveryDate] = useState(formatDateForInput(new Date(Date.now() + 14 * 86400000)));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setErrorMessage(null);
    fetchNextNumbers()
      .then((data) => {
        setSuggestedCode(data.nextOrderNumber);
        setOrderCode(data.nextOrderNumber);
      })
      .catch((err) => console.error(err));

    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const product = products.find((p) => p.id === selectedProductId) || products[0];
    if (!product) {
      setErrorMessage('Nenhum produto disponível no catálogo industrial.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onCreateOrder({
        orderCode: orderCode.trim().toUpperCase(),
        client: client.trim(),
        clientDocument: clientDocument.trim(),
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        totalPrice: Number(quantity) * Number(unitPrice),
        orderDate,
        deliveryDate,
        notes,
      });
      setIsModalOpen(false);
      setClient('');
      setClientDocument('');
      setNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar pedido';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ord.orderCode.toLowerCase().includes(q) ||
      ord.client.toLowerCase().includes(q) ||
      ord.productName.toLowerCase().includes(q) ||
      (ord.linkedOpCode && ord.linkedOpCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Pedidos de Venda e Clientes
          </h2>
          <p className="text-xs text-slate-500">
            Códigos com sequencial garantido (PED-2026-XXXX) e integração direta com PCP
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido de Venda
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por Pedido (ex: PED-2026-0001), Cliente, Produto ou OP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table of Orders */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Código Pedido</th>
                <th className="py-3 px-4">Cliente / CNPJ</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4 text-right">Qtd</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4">Data Emissão</th>
                <th className="py-3 px-4">Prazo de Entrega</th>
                <th className="py-3 px-4">Ordem Vinculada (OP)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                    {ord.orderCode}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{ord.client}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {ord.clientDocument || 'CNPJ não informado'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800 max-w-[200px] truncate">
                      {ord.productName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{ord.productSku}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                    {formatNumber(ord.quantity)} un
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatCurrency(ord.totalPrice)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                    {formatDate(ord.orderDate)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-900 font-semibold">
                    {formatDate(ord.deliveryDate)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {ord.linkedOpCode ? (
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                        {ord.linkedOpCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Nenhuma OP gerada</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {!ord.linkedOpCode ? (
                        <button
                          onClick={() => onGenerateOpFromOrder(ord)}
                          title="Gerar Ordem de Produção a partir deste Pedido"
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-900 hover:text-white bg-slate-100 hover:bg-slate-900 active:scale-95 rounded-md transition-all flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Gerar OP</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Em produção
                        </span>
                      )}

                      <button
                        onClick={() => onDeleteOrder(ord)}
                        title="Excluir Pedido"
                        aria-label={`Excluir pedido ${ord.orderCode}`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    Nenhum Pedido de Venda encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Novo Pedido de Venda</h3>
                  <p className="text-xs text-slate-500">
                    Sequencial automático protegido contra conflitos (PED-2026-XXXX)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Código Sugerido */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">Código do Pedido</label>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Sugerido: {suggestedCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setOrderCode(suggestedCode)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-100 whitespace-nowrap"
                  >
                    Usar Sugestão
                  </button>
                </div>
              </div>

              {/* Cliente e Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razão Social / Cliente <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Ex: Petrobras S.A."
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNPJ / Documento
                  </label>
                  <input
                    type="text"
                    value={clientDocument}
                    onChange={(e) => setClientDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Produto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Fabricável <span className="text-rose-500">*</span>
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

              {/* Quantidade e Preço */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    required
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Datas de Emissão e Entrega */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Pedido
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Entrega Prometida
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Requisitos do Cliente
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Embalagem para exportação, certificado de matéria-prima..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  {isSubmitting ? 'Cadastrando...' : 'Salvar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
