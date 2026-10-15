import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import {
  calculateNextOpCode,
  calculateNextOrderCode,
  CURRENT_OPERATING_YEAR,
  isCodeDuplicate,
  normalizeOpCode,
  normalizeOrderCode,
} from './src/utils/codeGenerators.ts';
import {
  ProductionOrder,
  SalesOrder,
  Product,
  PcpMetrics,
  NextNumbersResponse,
  ProductionStatus,
} from './src/types/index.ts';

const app = express();
app.use(express.json());

// Diretório para persistência local dos dados
const DATA_DIR = path.resolve(import.meta.dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'pcp_database.json');

// Catálogo padrão de produtos industriais para manufatura e usinagem
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'FLG-INOX-316',
    name: 'Flange Cego ANSI B16.5 4" Inox 316L',
    category: 'Flanges & Tubulação',
    unit: 'pç',
    drawingNumber: 'DWG-FLG-316-04B',
    materialSpecification: 'Aço Inox Austenítico ASTM A182 F316L Forjado',
    standardLeadTimeDays: 4,
    defaultStages: [
      { name: 'Corte e Faceamento', workCenter: 'Serra Fita Franho CNC', standardMinutes: 45 },
      { name: 'Torneamento de Desbaste', workCenter: 'Torno CNC Mazak QT-200', standardMinutes: 90 },
      { name: 'Furação de Centro e Passagem', workCenter: 'Centro de Usinagem Romi D800', standardMinutes: 60 },
      { name: 'Usinagem de Acabamento e Face Raio', workCenter: 'Torno CNC Mazak QT-200', standardMinutes: 40 },
      { name: 'Inspeção Dimensional & Rugosidade', workCenter: 'Tridimensional Mitutoyo Crysta', standardMinutes: 30 },
    ],
    defaultMaterials: [
      { name: 'Tarugo Redondo Inox 316L Ø 220mm', sku: 'MAT-TAR-316-220', requiredQuantity: 1.15, unit: 'kg' },
      { name: 'Fluido de Corte Semi-Sintético', sku: 'INS-LUB-01', requiredQuantity: 0.2, unit: 'L' },
    ],
  },
  {
    id: 'prod-2',
    sku: 'EIX-TRANS-4340',
    name: 'Eixo Estriado de Transmissão Ø45 x 650mm',
    category: 'Eixos & Transmissão',
    unit: 'un',
    drawingNumber: 'DWG-EIX-4340-65',
    materialSpecification: 'Aço Cromo-Níquel-Molibdênio SAE 4340 Beneficiado',
    standardLeadTimeDays: 6,
    defaultStages: [
      { name: 'Corte Inicial do Tarugo', workCenter: 'Serra FitaFranho CNC', standardMinutes: 30 },
      { name: 'Torneamento entre Pontas', workCenter: 'Torno CNC Nardini Logic 175', standardMinutes: 110 },
      { name: 'Fresamento de Estrias Helicoidais', workCenter: 'Fresadora Geradora Fellows', standardMinutes: 85 },
      { name: 'Tratamento Térmico (Têmpera & Revenimento)', workCenter: 'Forno de Indução Eletrotérmico', standardMinutes: 180 },
      { name: 'Retífica Cilíndrica de Precisão', workCenter: 'Retífica Cilíndrica TOS Hostivar', standardMinutes: 50 },
      { name: 'Controle de Dureza Rockwell C', workCenter: 'Durômetro Mitutoyo HR-530', standardMinutes: 20 },
    ],
    defaultMaterials: [
      { name: 'Barra Laminada SAE 4340 Ø 55mm', sku: 'MAT-BAR-4340-55', requiredQuantity: 8.4, unit: 'kg' },
      { name: 'Pastilha Cerâmica de Retífica', sku: 'FER-RET-CBN', requiredQuantity: 1, unit: 'un' },
    ],
  },
  {
    id: 'prod-3',
    sku: 'SUP-ESTRUT-M12',
    name: 'Suporte Articulado para Célula Robótica M12',
    category: 'Caldeiraria & Solda',
    unit: 'cj',
    drawingNumber: 'DWG-SUP-ROB-12',
    materialSpecification: 'Chapa de Aço Estrutural ASTM A36 6.35mm',
    standardLeadTimeDays: 3,
    defaultStages: [
      { name: 'Corte a Laser de Fibra 4kW', workCenter: 'Laser Fibra Bodor 4020', standardMinutes: 25 },
      { name: 'Dobra CNC 4 Eixos', workCenter: 'Prensa Dobradeira Newton 150T', standardMinutes: 40 },
      { name: 'Gabaritagem e Ponteamento', workCenter: 'Bancada Modular Demmeler', standardMinutes: 35 },
      { name: 'Soldagem MIG/MAG Pulsada', workCenter: 'Célula Robotizada Fronius TPS/i', standardMinutes: 65 },
      { name: 'Pintura Eletrostática a Pó Preto Fosco', workCenter: 'Cabine de Pintura Poliéster', standardMinutes: 90 },
      { name: 'Inspeção Visual de Cordão de Solda (EV/LP)', workCenter: 'Bancada de CQ NDT', standardMinutes: 25 },
    ],
    defaultMaterials: [
      { name: 'Chapa Aço Carbono ASTM A36 1/4"', sku: 'MAT-CHP-A36-635', requiredQuantity: 14.5, unit: 'kg' },
      { name: 'Arame de Solda Sólido ER70S-6 1.2mm', sku: 'MAT-SOL-ER70S6', requiredQuantity: 0.8, unit: 'kg' },
      { name: 'Tinta Eletrostática Poliéster Preto', sku: 'MAT-TNT-POL-BLK', requiredQuantity: 0.35, unit: 'kg' },
    ],
  },
  {
    id: 'prod-4',
    sku: 'VAL-DIR-HIDR-04',
    name: 'Bloco Manifold Hidráulico 4 Vias CETOP 03',
    category: 'Hidráulica Industrial',
    unit: 'pç',
    drawingNumber: 'DWG-MNF-CTP-03',
    materialSpecification: 'Alumínio Aeronáutico Liga 7075-T651 Forjado',
    standardLeadTimeDays: 5,
    defaultStages: [
      { name: 'Esquadrejamento do Bloco', workCenter: 'Fresa Universal Romi U30', standardMinutes: 50 },
      { name: 'Usinagem de Canais e Cavidades CETOP', workCenter: 'Centro de Usinagem 5 Eixos Haas VF-2SS', standardMinutes: 140 },
      { name: 'Rosqueamento Rígido com Macho Rolador', workCenter: 'Centro de Usinagem Haas VF-2SS', standardMinutes: 35 },
      { name: 'Rebarbação Térmica e Lavagem Ultrassônica', workCenter: 'Lavadora Ultrassônica Kemet', standardMinutes: 40 },
      { name: 'Teste Hidrostático de Estanqueidade 350 bar', workCenter: 'Bancada Hidrostática Parker', standardMinutes: 45 },
    ],
    defaultMaterials: [
      { name: 'Bloco de Alumínio 7075 120x120x200mm', sku: 'MAT-ALU-7075-BLK', requiredQuantity: 7.8, unit: 'kg' },
      { name: 'O-Rings de Vedação Viton Shore 90', sku: 'VED-VIT-SH90', requiredQuantity: 8, unit: 'un' },
    ],
  },
];

// Pedidos Iniciais (com códigos PED-2026-XXXX)
const INITIAL_ORDERS: SalesOrder[] = [
  {
    id: 'ord-1',
    orderCode: 'PED-2026-0001',
    client: 'Petrobras S.A. - Refinaria RPBC',
    clientDocument: '33.000.167/0001-01',
    productId: 'prod-1',
    productName: 'Flange Cego ANSI B16.5 4" Inox 316L',
    productSku: 'FLG-INOX-316',
    quantity: 60,
    unitPrice: 285.5,
    totalPrice: 17130.0,
    orderDate: '2026-10-02',
    deliveryDate: '2026-10-18',
    status: 'em_producao',
    linkedOpCode: 'OP-2026-001',
    contactEmail: 'suprimentos@petrobras.com.br',
    contactPhone: '(13) 3362-8000',
    notes: 'Certificado de matéria-prima 3.1 exigido conforme norma EN 10204.',
    createdAt: '2026-10-02T08:30:00Z',
  },
  {
    id: 'ord-2',
    orderCode: 'PED-2026-0002',
    client: 'WEG Equipamentos Elétricos S.A.',
    clientDocument: '84.429.695/0001-11',
    productId: 'prod-2',
    productName: 'Eixo Estriado de Transmissão Ø45 x 650mm',
    productSku: 'EIX-TRANS-4340',
    quantity: 40,
    unitPrice: 420.0,
    totalPrice: 16800.0,
    orderDate: '2026-10-04',
    deliveryDate: '2026-10-22',
    status: 'em_producao',
    linkedOpCode: 'OP-2026-002',
    contactEmail: 'compras.motores@weg.net',
    contactPhone: '(47) 3276-4000',
    notes: 'Controle rigoroso de concentricidade máxima de 0,015mm.',
    createdAt: '2026-10-04T10:15:00Z',
  },
  {
    id: 'ord-3',
    orderCode: 'PED-2026-0003',
    client: 'Marcopolo Ônibus e Carrocerias',
    clientDocument: '88.611.835/0001-29',
    productId: 'prod-3',
    productName: 'Suporte Articulado para Célula Robótica M12',
    productSku: 'SUP-ESTRUT-M12',
    quantity: 120,
    unitPrice: 135.0,
    totalPrice: 16200.0,
    orderDate: '2026-10-08',
    deliveryDate: '2026-10-25',
    status: 'aberto',
    linkedOpCode: 'OP-2026-003',
    contactEmail: 'pcp.estruturas@marcopolo.com.br',
    contactPhone: '(54) 2101-4000',
    notes: 'Acabamento em pintura epóxi fosca com camada mínima de 80 micras.',
    createdAt: '2026-10-08T14:00:00Z',
  },
  {
    id: 'ord-4',
    orderCode: 'PED-2026-0004',
    client: 'Embraer Defesa & Segurança S.A.',
    clientDocument: '07.689.002/0001-89',
    productId: 'prod-4',
    productName: 'Bloco Manifold Hidráulico 4 Vias CETOP 03',
    productSku: 'VAL-DIR-HIDR-04',
    quantity: 25,
    unitPrice: 940.0,
    totalPrice: 23500.0,
    orderDate: '2026-10-10',
    deliveryDate: '2026-10-30',
    status: 'aberto',
    linkedOpCode: 'OP-2026-004',
    contactEmail: 'aero.compras@embraer.com.br',
    contactPhone: '(12) 3927-1000',
    notes: 'Anodização dura mil-spec tipo III classe 1.',
    createdAt: '2026-10-10T09:20:00Z',
  },
];

// OPs Iniciais (com códigos OP-2026-XXX)
const INITIAL_OPS: ProductionOrder[] = [
  {
    id: 'op-1',
    code: 'OP-2026-001',
    orderCode: 'PED-2026-0001',
    productId: 'prod-1',
    productName: 'Flange Cego ANSI B16.5 4" Inox 316L',
    productSku: 'FLG-INOX-316',
    drawingRef: 'DWG-FLG-316-04B',
    quantity: 60,
    unit: 'pç',
    client: 'Petrobras S.A. - Refinaria RPBC',
    priority: 'alta',
    status: 'em_producao',
    currentSector: 'Usinagem CNC',
    currentStageIndex: 2,
    stages: [
      {
        id: 's-1-1',
        name: 'Corte e Faceamento',
        workCenter: 'Serra Fita Franho CNC',
        standardMinutes: 45,
        status: 'concluido',
        completedAt: '2026-10-11T16:00:00Z',
        operator: 'Marcos Silva (Matr. 1042)',
      },
      {
        id: 's-1-2',
        name: 'Torneamento de Desbaste',
        workCenter: 'Torno CNC Mazak QT-200',
        standardMinutes: 90,
        status: 'concluido',
        completedAt: '2026-10-13T11:30:00Z',
        operator: 'Carlos Eduardo (Matr. 1088)',
      },
      {
        id: 's-1-3',
        name: 'Furação de Centro e Passagem',
        workCenter: 'Centro de Usinagem Romi D800',
        standardMinutes: 60,
        status: 'em_andamento',
        operator: 'Rodrigo Lima (Matr. 1105)',
      },
      {
        id: 's-1-4',
        name: 'Usinagem de Acabamento e Face Raio',
        workCenter: 'Torno CNC Mazak QT-200',
        standardMinutes: 40,
        status: 'pendente',
      },
      {
        id: 's-1-5',
        name: 'Inspeção Dimensional & Rugosidade',
        workCenter: 'Tridimensional Mitutoyo Crysta',
        standardMinutes: 30,
        status: 'pendente',
      },
    ],
    startDate: '2026-10-11',
    deadline: '2026-10-18',
    responsibleOperator: 'Eng. Roberto Faria (PCP)',
    technicalNotes: 'Face de assentamento Ra 3.2 a 6.3 µm com ranhura espiral fonográfica contínua.',
    materials: [
      { id: 'm-1', name: 'Tarugo Redondo Inox 316L Ø 220mm', sku: 'MAT-TAR-316-220', requiredQuantity: 69.0, unit: 'kg', batchNumber: 'LT-2610-INOX-A', allocated: true },
      { id: 'm-2', name: 'Fluido de Corte Semi-Sintético', sku: 'INS-LUB-01', requiredQuantity: 12.0, unit: 'L', allocated: true },
    ],
    qualityCheck: { approved: false },
    scrapQuantity: 1,
    createdAt: '2026-10-10T14:20:00Z',
    updatedAt: '2026-10-13T11:30:00Z',
  },
  {
    id: 'op-2',
    code: 'OP-2026-002',
    orderCode: 'PED-2026-0002',
    productId: 'prod-2',
    productName: 'Eixo Estriado de Transmissão Ø45 x 650mm',
    productSku: 'EIX-TRANS-4340',
    drawingRef: 'DWG-EIX-4340-65',
    quantity: 40,
    unit: 'un',
    client: 'WEG Equipamentos Elétricos S.A.',
    priority: 'urgente',
    status: 'em_producao',
    currentSector: 'Tratamento Térmico',
    currentStageIndex: 3,
    stages: [
      {
        id: 's-2-1',
        name: 'Corte Inicial do Tarugo',
        workCenter: 'Serra Fita Franho CNC',
        standardMinutes: 30,
        status: 'concluido',
        completedAt: '2026-10-09T14:00:00Z',
        operator: 'Marcos Silva (Matr. 1042)',
      },
      {
        id: 's-2-2',
        name: 'Torneamento entre Pontas',
        workCenter: 'Torno CNC Nardini Logic 175',
        standardMinutes: 110,
        status: 'concluido',
        completedAt: '2026-10-11T17:00:00Z',
        operator: 'José Valdir (Matr. 1030)',
      },
      {
        id: 's-2-3',
        name: 'Fresamento de Estrias Helicoidais',
        workCenter: 'Fresadora Geradora Fellows',
        standardMinutes: 85,
        status: 'concluido',
        completedAt: '2026-10-13T10:00:00Z',
        operator: 'José Valdir (Matr. 1030)',
      },
      {
        id: 's-2-4',
        name: 'Tratamento Térmico (Têmpera & Revenimento)',
        workCenter: 'Forno de Indução Eletrotérmico',
        standardMinutes: 180,
        status: 'em_andamento',
        operator: 'Geraldo Alencar (Matr. 1012)',
      },
      {
        id: 's-2-5',
        name: 'Retífica Cilíndrica de Precisão',
        workCenter: 'Retífica Cilíndrica TOS Hostivar',
        standardMinutes: 50,
        status: 'pendente',
      },
      {
        id: 's-2-6',
        name: 'Controle de Dureza Rockwell C',
        workCenter: 'Durômetro Mitutoyo HR-530',
        standardMinutes: 20,
        status: 'pendente',
      },
    ],
    startDate: '2026-10-09',
    deadline: '2026-10-22',
    responsibleOperator: 'Eng. Juliana Mendes (PCP)',
    technicalNotes: 'Dureza superficial após têmpera: 52 a 56 HRC. Núcleo com 32 a 36 HRC.',
    materials: [
      { id: 'm-3', name: 'Barra Laminada SAE 4340 Ø 55mm', sku: 'MAT-BAR-4340-55', requiredQuantity: 336.0, unit: 'kg', batchNumber: 'LT-2610-SAE4340-C', allocated: true },
      { id: 'm-4', name: 'Pastilha Cerâmica de Retífica', sku: 'FER-RET-CBN', requiredQuantity: 4, unit: 'un', allocated: true },
    ],
    qualityCheck: { approved: false },
    scrapQuantity: 0,
    createdAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-10-13T10:00:00Z',
  },
  {
    id: 'op-3',
    code: 'OP-2026-003',
    orderCode: 'PED-2026-0003',
    productId: 'prod-3',
    productName: 'Suporte Articulado para Célula Robótica M12',
    productSku: 'SUP-ESTRUT-M12',
    drawingRef: 'DWG-SUP-ROB-12',
    quantity: 120,
    unit: 'cj',
    client: 'Marcopolo Ônibus e Carrocerias',
    priority: 'media',
    status: 'aguardando_insumos',
    currentSector: 'Almoxarifado',
    currentStageIndex: 0,
    stages: [
      { id: 's-3-1', name: 'Corte a Laser de Fibra 4kW', workCenter: 'Laser Fibra Bodor 4020', standardMinutes: 25, status: 'pendente' },
      { id: 's-3-2', name: 'Dobra CNC 4 Eixos', workCenter: 'Prensa Dobradeira Newton 150T', standardMinutes: 40, status: 'pendente' },
      { id: 's-3-3', name: 'Gabaritagem e Ponteamento', workCenter: 'Bancada Modular Demmeler', standardMinutes: 35, status: 'pendente' },
      { id: 's-3-4', name: 'Soldagem MIG/MAG Pulsada', workCenter: 'Célula Robotizada Fronius TPS/i', standardMinutes: 65, status: 'pendente' },
      { id: 's-3-5', name: 'Pintura Eletrostática a Pó Preto Fosco', workCenter: 'Cabine de Pintura Poliéster', standardMinutes: 90, status: 'pendente' },
      { id: 's-3-6', name: 'Inspeção Visual de Cordão de Solda (EV/LP)', workCenter: 'Bancada de CQ NDT', standardMinutes: 25, status: 'pendente' },
    ],
    startDate: '2026-10-16',
    deadline: '2026-10-25',
    responsibleOperator: 'Eng. Roberto Faria (PCP)',
    technicalNotes: 'Aguardando entrega de arame de solda especial ER70S-6 do fornecedor Belgo.',
    materials: [
      { id: 'm-5', name: 'Chapa Aço Carbono ASTM A36 1/4"', sku: 'MAT-CHP-A36-635', requiredQuantity: 1740.0, unit: 'kg', batchNumber: 'LT-2609-A36', allocated: true },
      { id: 'm-6', name: 'Arame de Solda Sólido ER70S-6 1.2mm', sku: 'MAT-SOL-ER70S6', requiredQuantity: 96.0, unit: 'kg', allocated: false },
    ],
    qualityCheck: { approved: false },
    scrapQuantity: 0,
    createdAt: '2026-10-12T11:00:00Z',
    updatedAt: '2026-10-12T11:00:00Z',
  },
  {
    id: 'op-4',
    code: 'OP-2026-004',
    orderCode: 'PED-2026-0004',
    productId: 'prod-4',
    productName: 'Bloco Manifold Hidráulico 4 Vias CETOP 03',
    productSku: 'VAL-DIR-HIDR-04',
    drawingRef: 'DWG-MNF-CTP-03',
    quantity: 25,
    unit: 'pç',
    client: 'Embraer Defesa & Segurança S.A.',
    priority: 'alta',
    status: 'planejada',
    currentSector: 'Engenharia / PCP',
    currentStageIndex: 0,
    stages: [
      { id: 's-4-1', name: 'Esquadrejamento do Bloco', workCenter: 'Fresa Universal Romi U30', standardMinutes: 50, status: 'pendente' },
      { id: 's-4-2', name: 'Usinagem de Canais e Cavidades CETOP', workCenter: 'Centro de Usinagem 5 Eixos Haas VF-2SS', standardMinutes: 140, status: 'pendente' },
      { id: 's-4-3', name: 'Rosqueamento Rígido com Macho Rolador', workCenter: 'Centro de Usinagem Haas VF-2SS', standardMinutes: 35, status: 'pendente' },
      { id: 's-4-4', name: 'Rebarbação Térmica e Lavagem Ultrassônica', workCenter: 'Lavadora Ultrassônica Kemet', standardMinutes: 40, status: 'pendente' },
      { id: 's-4-5', name: 'Teste Hidrostático de Estanqueidade 350 bar', workCenter: 'Bancada Hidrostática Parker', standardMinutes: 45, status: 'pendente' },
    ],
    startDate: '2026-10-18',
    deadline: '2026-10-30',
    responsibleOperator: 'Eng. Juliana Mendes (PCP)',
    technicalNotes: 'Programa CNC pós-processado e validado em simulação Vericut.',
    materials: [
      { id: 'm-7', name: 'Bloco de Alumínio 7075 120x120x200mm', sku: 'MAT-ALU-7075-BLK', requiredQuantity: 195.0, unit: 'kg', batchNumber: 'LT-7075-AERO-09', allocated: true },
      { id: 'm-8', name: 'O-Rings de Vedação Viton Shore 90', sku: 'VED-VIT-SH90', requiredQuantity: 200, unit: 'un', allocated: true },
    ],
    qualityCheck: { approved: false },
    scrapQuantity: 0,
    createdAt: '2026-10-13T15:30:00Z',
    updatedAt: '2026-10-13T15:30:00Z',
  },
  {
    id: 'op-5',
    code: 'OP-2026-005',
    orderCode: null,
    productId: 'prod-1',
    productName: 'Flange Cego ANSI B16.5 4" Inox 316L',
    productSku: 'FLG-INOX-316',
    drawingRef: 'DWG-FLG-316-04B',
    quantity: 30,
    unit: 'pç',
    client: 'Estoque de Segurança / Manutenção',
    priority: 'baixa',
    status: 'concluida',
    currentSector: 'Expedição',
    currentStageIndex: 4,
    stages: [
      { id: 's-5-1', name: 'Corte e Faceamento', workCenter: 'Serra Fita Franho CNC', standardMinutes: 45, status: 'concluido', completedAt: '2026-10-05T10:00:00Z' },
      { id: 's-5-2', name: 'Torneamento de Desbaste', workCenter: 'Torno CNC Mazak QT-200', standardMinutes: 90, status: 'concluido', completedAt: '2026-10-06T14:00:00Z' },
      { id: 's-5-3', name: 'Furação de Centro e Passagem', workCenter: 'Centro de Usinagem Romi D800', standardMinutes: 60, status: 'concluido', completedAt: '2026-10-07T11:00:00Z' },
      { id: 's-5-4', name: 'Usinagem de Acabamento e Face Raio', workCenter: 'Torno CNC Mazak QT-200', standardMinutes: 40, status: 'concluido', completedAt: '2026-10-08T09:30:00Z' },
      { id: 's-5-5', name: 'Inspeção Dimensional & Rugosidade', workCenter: 'Tridimensional Mitutoyo Crysta', standardMinutes: 30, status: 'concluido', completedAt: '2026-10-08T15:00:00Z' },
    ],
    startDate: '2026-10-05',
    deadline: '2026-10-10',
    completedDate: '2026-10-08T15:30:00Z',
    responsibleOperator: 'Marcos Silva (Matr. 1042)',
    technicalNotes: 'Lote concluído com sucesso e aprovado pelo controle de qualidade.',
    materials: [
      { id: 'm-9', name: 'Tarugo Redondo Inox 316L Ø 220mm', sku: 'MAT-TAR-316-220', requiredQuantity: 34.5, unit: 'kg', batchNumber: 'LT-2610-INOX-A', allocated: true },
    ],
    qualityCheck: {
      inspectorName: 'Ana Paula Rocha (Inspetora CQ)',
      inspectedAt: '2026-10-08T15:00:00Z',
      approved: true,
      notes: 'Todas as cotas críticas dentro de +/- 0,02mm. Rugosidade Ra 3.5 µm conforme DWG.',
      scrappedCount: 0,
    },
    scrapQuantity: 0,
    createdAt: '2026-10-04T08:00:00Z',
    updatedAt: '2026-10-08T15:30:00Z',
  },
];

// Carregar ou inicializar banco de dados persistente
interface DatabaseStructure {
  productionOrders: ProductionOrder[];
  salesOrders: SalesOrder[];
  products: Product[];
}

function loadDatabase(): DatabaseStructure {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.productionOrders) && Array.isArray(parsed.salesOrders)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Falha ao carregar banco JSON, usando dados padrão:', err);
  }

  const initialData: DatabaseStructure = {
    productionOrders: INITIAL_OPS,
    salesOrders: INITIAL_ORDERS,
    products: DEFAULT_PRODUCTS,
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseStructure): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Falha ao salvar banco JSON:', err);
  }
}

let db = loadDatabase();

// ==========================================
// API ROUTES
// ==========================================

/**
 * ROTA DEDICADA: /api/next-numbers
 * Calcula de forma segura os próximos números sequenciais de OP e Pedido
 * com base na extração do MAIOR índice numérico, e não COUNT(*).
 */
app.get('/api/next-numbers', (_req: Request, res: Response) => {
  const opCodes = db.productionOrders.map((o) => o.code);
  const orderCodes = db.salesOrders.map((o) => o.orderCode);

  const nextOpNumber = calculateNextOpCode(opCodes, CURRENT_OPERATING_YEAR);
  const nextOrderNumber = calculateNextOrderCode(orderCodes, CURRENT_OPERATING_YEAR);

  // Extrair os maiores números para fins de telemetria e conferência
  const opRegex = new RegExp(`^OP-${CURRENT_OPERATING_YEAR}-(\\d+)$`, 'i');
  let highestOpSeq = 0;
  for (const c of opCodes) {
    const match = c.trim().match(opRegex);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val > highestOpSeq) highestOpSeq = val;
    }
  }

  const orderRegex = new RegExp(`^PED-${CURRENT_OPERATING_YEAR}-(\\d+)$`, 'i');
  let highestOrderSeq = 0;
  for (const c of orderCodes) {
    const match = c.trim().match(orderRegex);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val > highestOrderSeq) highestOrderSeq = val;
    }
  }

  const response: NextNumbersResponse = {
    nextOpNumber,
    nextOrderNumber,
    year: CURRENT_OPERATING_YEAR,
    existingOpCount: db.productionOrders.length,
    existingOrderCount: db.salesOrders.length,
    highestOpSeq,
    highestOrderSeq,
  };

  res.json(response);
});

// Listar todas as OPs
app.get('/api/production-orders', (_req: Request, res: Response) => {
  res.json(db.productionOrders);
});

// Buscar OP específica
app.get('/api/production-orders/:id', (req: Request, res: Response) => {
  const order = db.productionOrders.find((o) => o.id === req.params.id || o.code === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Ordem de Produção não encontrada' });
    return;
  }
  res.json(order);
});

// Criar nova OP com prevenção estrita de chave duplicada
app.post('/api/production-orders', (req: Request, res: Response) => {
  const body = req.body;
  const existingCodes = db.productionOrders.map((o) => o.code);

  let candidateCode = body.code ? String(body.code).trim().toUpperCase() : '';

  // Se código não informado ou auto, calcular próximo sequencial
  if (!candidateCode) {
    candidateCode = calculateNextOpCode(existingCodes, CURRENT_OPERATING_YEAR);
  } else {
    candidateCode = normalizeOpCode(candidateCode);
    // Validar se o código informado já existe (UNIQUE constraint)
    if (isCodeDuplicate(candidateCode, existingCodes)) {
      res.status(409).json({
        error: `UNIQUE constraint failed: O código '${candidateCode}' já existe no sistema. Sugestão segura: '${calculateNextOpCode(existingCodes, CURRENT_OPERATING_YEAR)}'`,
        suggestedCode: calculateNextOpCode(existingCodes, CURRENT_OPERATING_YEAR),
      });
      return;
    }
  }

  const newOp: ProductionOrder = {
    id: `op-${Date.now()}`,
    code: candidateCode,
    orderCode: body.orderCode ? normalizeOrderCode(body.orderCode) : null,
    productId: body.productId,
    productName: body.productName,
    productSku: body.productSku,
    drawingRef: body.drawingRef || 'DWG-STD',
    quantity: Number(body.quantity) || 1,
    unit: body.unit || 'pç',
    client: body.client || 'Cliente Padrão',
    priority: body.priority || 'media',
    status: body.status || 'planejada',
    currentSector: body.currentSector || 'PCP / Engenharia',
    currentStageIndex: 0,
    stages: Array.isArray(body.stages) && body.stages.length > 0 ? body.stages : [
      { id: `stg-${Date.now()}-1`, name: 'Preparação & Setup', workCenter: 'Bancada Inicial', standardMinutes: 30, status: 'pendente' },
      { id: `stg-${Date.now()}-2`, name: 'Processamento Primário', workCenter: 'Centro Produtivo 01', standardMinutes: 60, status: 'pendente' },
      { id: `stg-${Date.now()}-3`, name: 'Inspeção Final & Liberação', workCenter: 'Controle de Qualidade', standardMinutes: 20, status: 'pendente' },
    ],
    startDate: body.startDate || new Date().toISOString().split('T')[0],
    deadline: body.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    responsibleOperator: body.responsibleOperator || 'Operador Responsável',
    technicalNotes: body.technicalNotes || '',
    materials: Array.isArray(body.materials) ? body.materials : [],
    qualityCheck: { approved: false },
    scrapQuantity: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Se vinculada a um Pedido de Venda, atualizar status do pedido para 'em_producao'
  if (newOp.orderCode) {
    const linkedOrder = db.salesOrders.find(
      (ord) => ord.orderCode === newOp.orderCode || normalizeOrderCode(ord.orderCode) === newOp.orderCode
    );
    if (linkedOrder) {
      linkedOrder.linkedOpCode = newOp.code;
      linkedOrder.status = 'em_producao';
    }
  }

  db.productionOrders.unshift(newOp);
  saveDatabase(db);

  res.status(201).json(newOp);
});

// AÇÃO DEDICADA: Cancelar Ordem de Produção
app.patch('/api/production-orders/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, notes, cancelledBy } = req.body;

  const orderIndex = db.productionOrders.findIndex((o) => o.id === id || o.code === id);
  if (orderIndex === -1) {
    res.status(404).json({ error: 'Ordem de Produção não encontrada' });
    return;
  }

  const order = db.productionOrders[orderIndex];

  if (order.status === 'concluida') {
    res.status(400).json({ error: 'Não é possível cancelar uma Ordem de Produção já concluída.' });
    return;
  }

  if (order.status === 'cancelada') {
    res.status(400).json({ error: 'Esta Ordem de Produção já está cancelada.' });
    return;
  }

  const updatedOrder: ProductionOrder = {
    ...order,
    status: 'cancelada',
    cancelledAt: new Date().toISOString(),
    cancelReason: reason || 'Cancelamento solicitado no painel',
    cancelNotes: notes || '',
    cancelledBy: cancelledBy || 'Operador do Painel PCP',
    updatedAt: new Date().toISOString(),
  };

  // Se houver pedido vinculado, registrar nas anotações do pedido
  if (order.orderCode) {
    const linkedOrder = db.salesOrders.find(
      (ord) => ord.orderCode === order.orderCode || ord.linkedOpCode === order.code
    );
    if (linkedOrder) {
      linkedOrder.notes = (linkedOrder.notes ? linkedOrder.notes + ' · ' : '') + `[OP ${order.code} cancelada: ${reason || 'Cancelamento solicitado'}]`;
    }
  }

  db.productionOrders[orderIndex] = updatedOrder;
  saveDatabase(db);

  res.json({
    message: `Ordem ${order.code} cancelada com sucesso.`,
    order: updatedOrder,
  });
});

// Avançar etapa / status da OP com transição inteligente de etapas
app.patch('/api/production-orders/:id/advance-stage', (req: Request, res: Response) => {
  const { id } = req.params;
  const { operator, notes } = req.body;

  const orderIndex = db.productionOrders.findIndex((o) => o.id === id || o.code === id);
  if (orderIndex === -1) {
    res.status(404).json({ error: 'Ordem de Produção não encontrada' });
    return;
  }

  const order = db.productionOrders[orderIndex];
  if (order.status === 'concluida' || order.status === 'cancelada') {
    res.status(400).json({ error: `Não é possível avançar ordem com status '${order.status}'` });
    return;
  }

  const stages = [...order.stages];
  let currentIdx = order.currentStageIndex;
  let newStatus: ProductionStatus = order.status;
  let newSector = order.currentSector;
  let completedDate: string | null = order.completedDate || null;

  // CASO 1: Se a ordem ainda está 'planejada' ou 'aguardando_insumos' e a primeira etapa está 'pendente',
  // o primeiro avanço INICIA a produção da primeira etapa sem pulá-la!
  if ((order.status === 'planejada' || order.status === 'aguardando_insumos') && stages[0]?.status === 'pendente') {
    stages[0] = {
      ...stages[0],
      status: 'em_andamento',
      operator: operator || stages[0].operator || 'Operador Responsável',
      notes: notes || stages[0].notes,
    };
    newStatus = 'em_producao';
    newSector = stages[0].workCenter || 'Chão de Fábrica';
    currentIdx = 0;
  } else {
    // CASO 2: A etapa atual é concluída e avançamos para a próxima
    if (stages[currentIdx]) {
      stages[currentIdx] = {
        ...stages[currentIdx],
        status: 'concluido',
        completedAt: new Date().toISOString(),
        operator: operator || stages[currentIdx].operator || 'Operador Responsável',
        notes: notes || stages[currentIdx].notes,
      };
    }

    currentIdx += 1;

    if (currentIdx < stages.length) {
      stages[currentIdx] = {
        ...stages[currentIdx],
        status: 'em_andamento',
      };
      // Verificar se a etapa é de controle de qualidade
      const stageName = (stages[currentIdx].name || '').toLowerCase();
      const workCenter = (stages[currentIdx].workCenter || '').toLowerCase();
      if (
        stageName.includes('qualidade') ||
        stageName.includes('inspeção') ||
        stageName.includes('inspecao') ||
        workCenter.includes('qualidade') ||
        workCenter.includes('cq') ||
        workCenter.includes('tridimensional')
      ) {
        newStatus = 'controle_qualidade';
      } else {
        newStatus = 'em_producao';
      }
      newSector = stages[currentIdx].workCenter || 'Chão de Fábrica';
    } else {
      // Todas as etapas foram concluídas!
      newStatus = 'concluida';
      newSector = 'Expedição / Concluído';
      completedDate = new Date().toISOString();

      // Se houver pedido vinculado, marcar pedido como atendido
      if (order.orderCode) {
        const linkedOrder = db.salesOrders.find(
          (ord) => ord.orderCode === order.orderCode || ord.linkedOpCode === order.code
        );
        if (linkedOrder) {
          linkedOrder.status = 'atendido';
        }
      }
    }
  }

  const updatedOrder: ProductionOrder = {
    ...order,
    stages,
    currentStageIndex: Math.min(currentIdx, Math.max(0, stages.length - 1)),
    status: newStatus,
    currentSector: newSector,
    completedDate,
    updatedAt: new Date().toISOString(),
  };

  db.productionOrders[orderIndex] = updatedOrder;
  saveDatabase(db);

  res.json(updatedOrder);
});

// Atualizar OP completa
app.put('/api/production-orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const orderIndex = db.productionOrders.findIndex((o) => o.id === id);

  if (orderIndex === -1) {
    res.status(404).json({ error: 'Ordem de Produção não encontrada' });
    return;
  }

  const existingCodes = db.productionOrders.filter((o) => o.id !== id).map((o) => o.code);
  const candidateCode = req.body.code ? String(req.body.code).trim().toUpperCase() : db.productionOrders[orderIndex].code;

  if (isCodeDuplicate(candidateCode, existingCodes)) {
    res.status(409).json({ error: `UNIQUE constraint failed: O código '${candidateCode}' já pertence a outra OP.` });
    return;
  }

  const updated: ProductionOrder = {
    ...db.productionOrders[orderIndex],
    ...req.body,
    code: candidateCode,
    updatedAt: new Date().toISOString(),
  };

  db.productionOrders[orderIndex] = updated;
  saveDatabase(db);
  res.json(updated);
});

// Excluir OP (testa que exclusões não quebram o próximo sequencial)
app.delete('/api/production-orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const target = db.productionOrders.find((o) => o.id === id || o.code === id);
  if (!target) {
    res.status(404).json({ error: 'Ordem de Produção não encontrada' });
    return;
  }

  // Se havia pedido vinculado, desvincular e retornar para status 'aberto'
  if (target.orderCode) {
    const linkedOrder = db.salesOrders.find(
      (ord) => ord.orderCode === target.orderCode || ord.linkedOpCode === target.code
    );
    if (linkedOrder && linkedOrder.linkedOpCode === target.code) {
      linkedOrder.linkedOpCode = null;
      if (linkedOrder.status === 'em_producao') {
        linkedOrder.status = 'aberto';
      }
    }
  }

  db.productionOrders = db.productionOrders.filter((o) => o.id !== target.id);
  saveDatabase(db);

  // Retorna já informando qual será a próxima numeração
  const nextOpNumber = calculateNextOpCode(
    db.productionOrders.map((o) => o.code),
    CURRENT_OPERATING_YEAR
  );

  res.json({
    message: `Ordem ${target.code} excluída com sucesso. Próxima numeração preservada: ${nextOpNumber}`,
    deletedCode: target.code,
    nextOpNumber,
  });
});

// ==========================================
// PEDIDOS DE VENDA (SALES ORDERS)
// ==========================================

app.get('/api/orders', (_req: Request, res: Response) => {
  res.json(db.salesOrders);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const body = req.body;
  const existingCodes = db.salesOrders.map((o) => o.orderCode);

  let candidateCode = body.orderCode ? String(body.orderCode).trim().toUpperCase() : '';
  if (!candidateCode) {
    candidateCode = calculateNextOrderCode(existingCodes, CURRENT_OPERATING_YEAR);
  } else {
    candidateCode = normalizeOrderCode(candidateCode);
    if (isCodeDuplicate(candidateCode, existingCodes)) {
      res.status(409).json({
        error: `UNIQUE constraint failed: O pedido '${candidateCode}' já existe. Sugestão: '${calculateNextOrderCode(existingCodes, CURRENT_OPERATING_YEAR)}'`,
        suggestedCode: calculateNextOrderCode(existingCodes, CURRENT_OPERATING_YEAR),
      });
      return;
    }
  }

  const newOrder: SalesOrder = {
    id: `ord-${Date.now()}`,
    orderCode: candidateCode,
    client: body.client,
    clientDocument: body.clientDocument || '',
    productId: body.productId,
    productName: body.productName,
    productSku: body.productSku,
    quantity: Number(body.quantity) || 1,
    unitPrice: Number(body.unitPrice) || 0,
    totalPrice: (Number(body.quantity) || 1) * (Number(body.unitPrice) || 0),
    orderDate: body.orderDate || new Date().toISOString().split('T')[0],
    deliveryDate: body.deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'aberto',
    linkedOpCode: body.linkedOpCode || null,
    contactEmail: body.contactEmail || '',
    contactPhone: body.contactPhone || '',
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
  };

  db.salesOrders.unshift(newOrder);
  saveDatabase(db);
  res.status(201).json(newOrder);
});

app.delete('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const target = db.salesOrders.find((o) => o.id === id || o.orderCode === id);
  if (!target) {
    res.status(404).json({ error: 'Pedido não encontrado' });
    return;
  }

  db.salesOrders = db.salesOrders.filter((o) => o.id !== target.id);
  saveDatabase(db);

  const nextOrderNumber = calculateNextOrderCode(
    db.salesOrders.map((o) => o.orderCode),
    CURRENT_OPERATING_YEAR
  );

  res.json({
    message: `Pedido ${target.orderCode} excluído. Próxima numeração preservada: ${nextOrderNumber}`,
    deletedCode: target.orderCode,
    nextOrderNumber,
  });
});

// Produtos
app.get('/api/products', (_req: Request, res: Response) => {
  res.json(db.products);
});

// Métricas do PCP
app.get('/api/metrics', (_req: Request, res: Response) => {
  const ops = db.productionOrders;
  const totalOps = ops.length;
  const inProgressOps = ops.filter((o) => o.status === 'em_producao').length;
  const plannedOps = ops.filter((o) => o.status === 'planejada').length;
  const waitingMaterialsOps = ops.filter((o) => o.status === 'aguardando_insumos').length;
  const inQualityOps = ops.filter((o) => o.status === 'controle_qualidade').length;
  const completedOps = ops.filter((o) => o.status === 'concluida').length;
  const cancelledOps = ops.filter((o) => o.status === 'cancelada').length;

  const todayStr = '2026-10-15';
  let overdueCount = 0;
  let onTimeCount = 0;

  for (const op of ops) {
    if (op.status === 'concluida') {
      onTimeCount++;
    } else if (op.status !== 'cancelada') {
      if (op.deadline < todayStr) {
        overdueCount++;
      } else {
        onTimeCount++;
      }
    }
  }

  const activeTotal = inProgressOps + plannedOps + waitingMaterialsOps + inQualityOps;
  const otdPercentage = totalOps > 0 ? Number(((onTimeCount / (totalOps - cancelledOps || 1)) * 100).toFixed(1)) : 100;

  const totalProducedUnits = ops
    .filter((o) => o.status === 'concluida')
    .reduce((sum, o) => sum + o.quantity, 0);

  const totalScrapUnits = ops.reduce((sum, o) => sum + (o.scrapQuantity || 0), 0);
  const scrapPpm = totalProducedUnits > 0 ? Math.round((totalScrapUnits / (totalProducedUnits + totalScrapUnits)) * 1000000) : 450;

  const metrics: PcpMetrics = {
    totalOps,
    inProgressOps,
    plannedOps,
    waitingMaterialsOps,
    inQualityOps,
    completedOps,
    cancelledOps,
    onTimeCount,
    overdueCount,
    otdPercentage: Math.min(100, Math.max(0, otdPercentage)),
    scrapPpm,
    averageLeadTimeDays: 4.8,
    totalUnitsProduced: totalProducedUnits,
  };

  res.json(metrics);
});

// Reiniciar base com dados de demonstração
app.post('/api/reset-demo-data', (_req: Request, res: Response) => {
  db = {
    productionOrders: JSON.parse(JSON.stringify(INITIAL_OPS)),
    salesOrders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
    products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
  };
  saveDatabase(db);
  res.json({ message: 'Dados restaurados com sucesso!' });
});

// ==========================================
// VITE DEV SERVER OU ARQUIVOS ESTÁTICOS
// ==========================================

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PCP Industrial] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erro fatal ao iniciar servidor:', err);
  process.exit(1);
});
