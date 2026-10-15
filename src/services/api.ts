import { ProductionOrder, SalesOrder, Product, PcpMetrics, NextNumbersResponse } from '../types/index.ts';
import { calculateNextOpCode, calculateNextOrderCode, CURRENT_OPERATING_YEAR } from '../utils/codeGenerators.ts';

const BASE_URL = '';

export async function fetchNextNumbers(
  fallbackOps?: ProductionOrder[],
  fallbackOrders?: SalesOrder[]
): Promise<NextNumbersResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/next-numbers`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Falha na rota /api/next-numbers, aplicando cálculo local seguro:', err);
  }

  // Fallback seguro usando cálculo local de índice máximo
  const opCodes = (fallbackOps || []).map((o) => o.code);
  const orderCodes = (fallbackOrders || []).map((o) => o.orderCode);

  return {
    nextOpNumber: calculateNextOpCode(opCodes, CURRENT_OPERATING_YEAR),
    nextOrderNumber: calculateNextOrderCode(orderCodes, CURRENT_OPERATING_YEAR),
    year: CURRENT_OPERATING_YEAR,
    existingOpCount: opCodes.length,
    existingOrderCount: orderCodes.length,
    highestOpSeq: 0,
    highestOrderSeq: 0,
  };
}

export async function fetchProductionOrders(): Promise<ProductionOrder[]> {
  const res = await fetch(`${BASE_URL}/api/production-orders`);
  if (!res.ok) throw new Error('Erro ao carregar Ordens de Produção');
  return res.json();
}

export async function createProductionOrder(
  order: Partial<ProductionOrder>
): Promise<ProductionOrder> {
  const res = await fetch(`${BASE_URL}/api/production-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao criar Ordem de Produção');
  }

  return res.json();
}

export async function cancelProductionOrder(
  id: string,
  payload: { reason: string; notes?: string; cancelledBy?: string }
): Promise<{ message: string; order: ProductionOrder }> {
  const res = await fetch(`${BASE_URL}/api/production-orders/${id}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao cancelar Ordem de Produção');
  }

  return res.json();
}

export async function advanceOrderStage(
  id: string,
  payload?: { operator?: string; notes?: string }
): Promise<ProductionOrder> {
  const res = await fetch(`${BASE_URL}/api/production-orders/${id}/advance-stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao avançar etapa da ordem');
  }

  return res.json();
}

export async function deleteProductionOrder(id: string): Promise<{ message: string; nextOpNumber: string }> {
  const res = await fetch(`${BASE_URL}/api/production-orders/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao excluir Ordem de Produção');
  }

  return res.json();
}

export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const res = await fetch(`${BASE_URL}/api/orders`);
  if (!res.ok) throw new Error('Erro ao carregar Pedidos de Venda');
  return res.json();
}

export async function createSalesOrder(order: Partial<SalesOrder>): Promise<SalesOrder> {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao cadastrar Pedido');
  }

  return res.json();
}

export async function deleteSalesOrder(id: string): Promise<{ message: string; nextOrderNumber: string }> {
  const res = await fetch(`${BASE_URL}/api/orders/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao excluir Pedido');
  }

  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/api/products`);
  if (!res.ok) throw new Error('Erro ao carregar produtos');
  return res.json();
}

export async function fetchMetrics(): Promise<PcpMetrics> {
  const res = await fetch(`${BASE_URL}/api/metrics`);
  if (!res.ok) throw new Error('Erro ao carregar métricas');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  await fetch(`${BASE_URL}/api/reset-demo-data`, { method: 'POST' });
}
