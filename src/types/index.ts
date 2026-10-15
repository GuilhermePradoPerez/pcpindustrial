export type PriorityLevel = 'baixa' | 'media' | 'alta' | 'urgente';

export type ProductionStatus =
  | 'planejada'
  | 'aguardando_insumos'
  | 'em_producao'
  | 'controle_qualidade'
  | 'concluida'
  | 'cancelada';

export type SalesOrderStatus = 'aberto' | 'em_producao' | 'atendido' | 'cancelado';

export interface ProductionStage {
  id: string;
  name: string;
  workCenter: string;
  standardMinutes: number;
  status: 'pendente' | 'em_andamento' | 'concluido';
  completedAt?: string | null;
  operator?: string | null;
  notes?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  sku: string;
  requiredQuantity: number;
  unit: string;
  batchNumber?: string;
  allocated: boolean;
}

export interface QualityCheckInfo {
  inspectorName?: string;
  inspectedAt?: string | null;
  approved: boolean;
  notes?: string;
  scrappedCount?: number;
}

export interface ProductionOrder {
  id: string;
  code: string; // Ex: OP-2026-001
  orderCode?: string | null; // Ex: PED-2026-0001
  productId: string;
  productName: string;
  productSku: string;
  drawingRef: string; // Referência de desenho técnico
  quantity: number;
  unit: string;
  client: string;
  priority: PriorityLevel;
  status: ProductionStatus;
  currentSector: string;
  currentStageIndex: number;
  stages: ProductionStage[];
  startDate: string; // YYYY-MM-DD ou ISO
  deadline: string; // YYYY-MM-DD ou ISO
  completedDate?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  cancelNotes?: string | null;
  cancelledBy?: string | null;
  responsibleOperator: string;
  technicalNotes?: string;
  materials: MaterialItem[];
  qualityCheck?: QualityCheckInfo;
  scrapQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrder {
  id: string;
  orderCode: string; // Ex: PED-2026-0001
  client: string;
  clientDocument: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  status: SalesOrderStatus;
  linkedOpCode?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  drawingNumber: string;
  materialSpecification: string;
  standardLeadTimeDays: number;
  defaultStages: { name: string; workCenter: string; standardMinutes: number }[];
  defaultMaterials: { name: string; sku: string; requiredQuantity: number; unit: string }[];
}

export interface NextNumbersResponse {
  nextOpNumber: string;
  nextOrderNumber: string;
  year: number;
  existingOpCount: number;
  existingOrderCount: number;
  highestOpSeq: number;
  highestOrderSeq: number;
}

export interface PcpMetrics {
  totalOps: number;
  inProgressOps: number;
  plannedOps: number;
  waitingMaterialsOps: number;
  inQualityOps: number;
  completedOps: number;
  cancelledOps: number;
  onTimeCount: number;
  overdueCount: number;
  otdPercentage: number; // Ex: 96.4 (%)
  scrapPpm: number;
  averageLeadTimeDays: number;
  totalUnitsProduced: number;
}
