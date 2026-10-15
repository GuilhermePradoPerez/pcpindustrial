/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DashboardPanel } from './components/DashboardPanel.tsx';
import { ProductionOrdersView } from './components/ProductionOrdersView.tsx';
import { SalesOrdersView } from './components/SalesOrdersView.tsx';
import { JobTicketPrintA4 } from './components/JobTicketPrintA4.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { NewOpModal } from './components/NewOpModal.tsx';
import { CancelOrderModal } from './components/CancelOrderModal.tsx';
import { OpDetailsModal } from './components/OpDetailsModal.tsx';
import {
  fetchProductionOrders,
  fetchSalesOrders,
  fetchProducts,
  fetchMetrics,
  createProductionOrder,
  cancelProductionOrder,
  advanceOrderStage,
  deleteProductionOrder,
  createSalesOrder,
  deleteSalesOrder,
  resetDemoData,
} from './services/api.ts';
import { ProductionOrder, SalesOrder, Product, PcpMetrics } from './types/index.ts';
import { CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';

interface ToastState {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'production' | 'print' | 'reports'>('dashboard');
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<PcpMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isNewOpOpen, setIsNewOpOpen] = useState(false);
  const [prelinkedOrderCode, setPrelinkedOrderCode] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<ProductionOrder | null>(null);
  const [orderInDetails, setOrderInDetails] = useState<ProductionOrder | null>(null);
  const [selectedPrintOpId, setSelectedPrintOpId] = useState<string>('');

  // Toast feedback
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [ops, orders, prods, metrs] = await Promise.all([
        fetchProductionOrders(),
        fetchSalesOrders(),
        fetchProducts(),
        fetchMetrics(),
      ]);
      setProductionOrders(ops);
      setSalesOrders(orders);
      setProducts(prods);
      setMetrics(metrs);
      if (ops.length > 0 && !selectedPrintOpId) {
        setSelectedPrintOpId(ops[0].id);
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados:', err);
      showToast('Falha ao conectar à API local do PCP. Operando com cache.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPrintOpId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers para Ordens de Produção
  const handleCreateOp = async (opData: Record<string, unknown>) => {
    const created = await createProductionOrder(opData);
    setProductionOrders((prev) => [created, ...prev]);
    showToast(`Ordem de Produção ${created.code} criada com sucesso e roteiro liberado!`, 'success');
    loadData(true);
  };

  const handleConfirmCancelOrder = async (payload: { reason: string; notes: string; cancelledBy: string }) => {
    if (!orderToCancel) return;
    const res = await cancelProductionOrder(orderToCancel.id, payload);
    setProductionOrders((prev) =>
      prev.map((o) => (o.id === res.order.id ? res.order : o))
    );
    showToast(`Ordem ${orderToCancel.code} cancelada: ${payload.reason}`, 'info');
    loadData(true);
  };

  const handleAdvanceStage = async (order: ProductionOrder) => {
    try {
      const updated = await advanceOrderStage(order.id);
      setProductionOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      if (updated.status === 'concluida') {
        showToast(`Ordem ${updated.code} foi totalmente concluída e liberada para expedição!`, 'success');
      } else {
        showToast(`Ordem ${updated.code} avançada para o setor: ${updated.currentSector}`, 'info');
      }
      loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao avançar etapa';
      showToast(msg, 'error');
    }
  };

  const handleDeleteOp = async (order: ProductionOrder) => {
    if (!confirm(`Deseja realmente excluir a ordem ${order.code}? O próximo sequencial permanecerá seguro e sem conflitos.`)) {
      return;
    }
    try {
      const res = await deleteProductionOrder(order.id);
      setProductionOrders((prev) => prev.filter((o) => o.id !== order.id));
      showToast(`${res.message}`, 'info');
      loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir';
      showToast(msg, 'error');
    }
  };

  // Handlers para Pedidos de Venda
  const handleCreateSalesOrder = async (orderData: Partial<SalesOrder>) => {
    const created = await createSalesOrder(orderData);
    setSalesOrders((prev) => [created, ...prev]);
    showToast(`Pedido ${created.orderCode} registrado com sucesso!`, 'success');
    loadData(true);
  };

  const handleDeleteSalesOrder = async (order: SalesOrder) => {
    if (!confirm(`Deseja excluir o pedido ${order.orderCode}?`)) return;
    try {
      const res = await deleteSalesOrder(order.id);
      setSalesOrders((prev) => prev.filter((o) => o.id !== order.id));
      showToast(`${res.message}`, 'info');
      loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir pedido';
      showToast(msg, 'error');
    }
  };

  const handleGenerateOpFromOrder = (order: SalesOrder) => {
    setPrelinkedOrderCode(order.orderCode);
    setIsNewOpOpen(true);
  };

  const handleSelectForPrint = (order: ProductionOrder) => {
    setSelectedPrintOpId(order.id);
    setActiveTab('print');
  };

  const handleResetData = async () => {
    if (!confirm('Deseja restaurar os dados de demonstração da fábrica?')) return;
    try {
      await resetDemoData();
      showToast('Dados de demonstração restaurados com sucesso!', 'success');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOp={() => {
          setPrelinkedOrderCode(null);
          setIsNewOpOpen(true);
        }}
        onRefresh={() => loadData()}
        isRefreshing={isRefreshing}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono">
                Inicializando módulo PCP Industrial...
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPanel
                orders={productionOrders}
                metrics={metrics}
                onAdvanceStage={handleAdvanceStage}
                onRequestCancel={(op) => setOrderToCancel(op)}
                onSelectForPrint={handleSelectForPrint}
                onOpenDetails={(op) => setOrderInDetails(op)}
                onOpenNewOp={() => {
                  setPrelinkedOrderCode(null);
                  setIsNewOpOpen(true);
                }}
              />
            )}

            {activeTab === 'production' && (
              <ProductionOrdersView
                orders={productionOrders}
                onOpenNewOp={() => {
                  setPrelinkedOrderCode(null);
                  setIsNewOpOpen(true);
                }}
                onAdvanceStage={handleAdvanceStage}
                onRequestCancel={(op) => setOrderToCancel(op)}
                onSelectForPrint={handleSelectForPrint}
                onDeleteOrder={handleDeleteOp}
                onOpenDetails={(op) => setOrderInDetails(op)}
              />
            )}

            {activeTab === 'orders' && (
              <SalesOrdersView
                orders={salesOrders}
                products={products}
                onCreateOrder={handleCreateSalesOrder}
                onDeleteOrder={handleDeleteSalesOrder}
                onGenerateOpFromOrder={handleGenerateOpFromOrder}
              />
            )}

            {activeTab === 'print' && (
              <JobTicketPrintA4
                orders={productionOrders}
                selectedOrderId={selectedPrintOpId}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView orders={productionOrders} metrics={metrics} />
            )}
          </>
        )}
      </main>

      {/* Footer (Quiet anti-slop) */}
      <footer className="no-print border-t border-slate-200 py-4 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">PCP Industrial</span>
            <span aria-hidden="true">·</span>
            <span>Unicidade de OP-2026-XXX & PED-2026-XXXX garantida por índice sequencial</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Ano Base: 2026</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Restaurar Dados Demo
            </button>
            <span aria-hidden="true">·</span>
            <span>ISO 9001:2015</span>
          </div>
        </div>
      </footer>

      {/* Modal Nova Ordem de Produção */}
      <NewOpModal
        isOpen={isNewOpOpen}
        onClose={() => {
          setIsNewOpOpen(false);
          setPrelinkedOrderCode(null);
        }}
        products={products}
        orders={salesOrders}
        onSubmit={handleCreateOp}
        initialOrderCode={prelinkedOrderCode}
      />

      {/* Modal Cancelar Ordem de Produção */}
      <CancelOrderModal
        order={orderToCancel}
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={handleConfirmCancelOrder}
      />

      {/* Modal Detalhes da OP */}
      <OpDetailsModal
        order={orderInDetails}
        isOpen={!!orderInDetails}
        onClose={() => setOrderInDetails(null)}
        onAdvanceStage={handleAdvanceStage}
        onRequestCancel={(op) => setOrderToCancel(op)}
        onSelectForPrint={handleSelectForPrint}
      />

      {/* Toast Notification Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3 rounded-lg shadow-lg border text-xs flex items-start gap-2.5 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-white text-slate-900 border-slate-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            )}
            <div className="leading-snug">{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
