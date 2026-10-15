import React, { useState } from 'react';
import { Printer, Download, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { ProductionOrder } from '../types/index.ts';
import { formatDate, formatDateTime, getDeadlineStatus, formatNumber } from '../utils/formatters.ts';

interface JobTicketPrintA4Props {
  orders: ProductionOrder[];
  selectedOrderId?: string;
  onBackToDashboard: () => void;
}

export const JobTicketPrintA4: React.FC<JobTicketPrintA4Props> = ({
  orders,
  selectedOrderId,
  onBackToDashboard,
}) => {
  const [activeId, setActiveId] = useState<string>(
    selectedOrderId || (orders.length > 0 ? orders[0].id : '')
  );

  // Sincronizar activeId quando a prop selectedOrderId mudar (ao clicar em imprimir em uma OP)
  React.useEffect(() => {
    if (selectedOrderId) {
      setActiveId(selectedOrderId);
    } else if (orders.length > 0 && !activeId) {
      setActiveId(orders[0].id);
    }
  }, [selectedOrderId, orders, activeId]);

  const currentOp = orders.find((o) => o.id === activeId || o.code === activeId) || orders[0];

  const handlePrint = () => {
    window.print();
  };

  if (!currentOp) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
        <p className="text-sm">Nenhuma Ordem de Produção disponível para impressão.</p>
      </div>
    );
  }

  const deadlineInfo = getDeadlineStatus(currentOp.deadline, currentOp.status);

  return (
    <div className="space-y-6">
      {/* Action Toolbar (hidden on print) */}
      <div className="no-print bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Selecione a OP:</label>
            <select
              value={currentOp.id}
              onChange={(e) => setActiveId(e.target.value)}
              className="text-xs font-mono font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} · {o.productSku} ({o.client})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block">Formato A4 Padrão Industrial</span>
            <span className="text-[11px] font-mono text-slate-700">ISO 9001:2015 Conforme</span>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all shadow-xs flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha (A4)</span>
          </button>
        </div>
      </div>

      {/* A4 PRINT CONTAINER */}
      <div className="print-container bg-white border border-slate-300 rounded-lg shadow-sm mx-auto p-8 max-w-[850px] text-slate-900 text-xs">
        {/* Cabecalho Industrial */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-base font-extrabold tracking-tight uppercase text-slate-900">
                METALSUL INDÚSTRIA METALÚRGICA S.A.
              </h1>
              <p className="text-[11px] text-slate-600">
                CNPJ: 45.123.890/0001-44 · Inscrição Estadual: 114.892.401.110
              </p>
              <p className="text-[11px] text-slate-500">
                Rodovia dos Bandeirantes, km 72 · Distrito Industrial · Jundiaí/SP
              </p>
              <div className="inline-block mt-1 font-bold text-xs uppercase px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-900">
                FICHA TÉCNICA DE PRODUÇÃO / ROTEIRO DE FABRICAÇÃO (PCP)
              </div>
            </div>

            {/* Código de Barras e OP */}
            <div className="text-right space-y-1">
              <div className="font-mono text-xl font-black text-slate-900 tracking-wider">
                {currentOp.code}
              </div>
              <div className="font-mono text-xs text-slate-600">
                {currentOp.orderCode ? `Pedido: ${currentOp.orderCode}` : 'Produção p/ Estoque'}
              </div>
              {/* Código de barras simulado em SVG preciso */}
              <div className="flex justify-end pt-1">
                <svg className="w-44 h-10" viewBox="0 0 160 40">
                  <rect x="0" y="0" width="3" height="35" fill="#000" />
                  <rect x="5" y="0" width="2" height="35" fill="#000" />
                  <rect x="9" y="0" width="4" height="35" fill="#000" />
                  <rect x="16" y="0" width="2" height="35" fill="#000" />
                  <rect x="21" y="0" width="5" height="35" fill="#000" />
                  <rect x="28" y="0" width="2" height="35" fill="#000" />
                  <rect x="33" y="0" width="4" height="35" fill="#000" />
                  <rect x="40" y="0" width="2" height="35" fill="#000" />
                  <rect x="44" y="0" width="6" height="35" fill="#000" />
                  <rect x="53" y="0" width="3" height="35" fill="#000" />
                  <rect x="58" y="0" width="2" height="35" fill="#000" />
                  <rect x="63" y="0" width="4" height="35" fill="#000" />
                  <rect x="70" y="0" width="2" height="35" fill="#000" />
                  <rect x="75" y="0" width="5" height="35" fill="#000" />
                  <rect x="83" y="0" width="2" height="35" fill="#000" />
                  <rect x="88" y="0" width="4" height="35" fill="#000" />
                  <rect x="95" y="0" width="3" height="35" fill="#000" />
                  <rect x="101" y="0" width="2" height="35" fill="#000" />
                  <rect x="106" y="0" width="5" height="35" fill="#000" />
                  <rect x="114" y="0" width="2" height="35" fill="#000" />
                  <rect x="119" y="0" width="4" height="35" fill="#000" />
                  <rect x="126" y="0" width="2" height="35" fill="#000" />
                  <rect x="131" y="0" width="6" height="35" fill="#000" />
                  <rect x="140" y="0" width="3" height="35" fill="#000" />
                  <rect x="146" y="0" width="2" height="35" fill="#000" />
                  <rect x="151" y="0" width="4" height="35" fill="#000" />
                  <text x="80" y="40" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#333">
                    *{currentOp.code}*
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 1: Dados Gerais da Ordem */}
        <div className="grid grid-cols-4 gap-2 border border-slate-300 p-3 bg-slate-50/50 mb-3 text-[11px]">
          <div>
            <span className="text-slate-500 block">Cliente Solicitante:</span>
            <span className="font-bold text-slate-900">{currentOp.client}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Data de Início Prevista:</span>
            <span className="font-mono font-medium text-slate-900">{formatDate(currentOp.startDate)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Prazo Final (Deadline):</span>
            <span className="font-mono font-bold text-slate-900">{deadlineInfo.formattedDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Prioridade / Status:</span>
            <span className="font-bold uppercase text-slate-900">
              {currentOp.priority} · {currentOp.status}
            </span>
          </div>
        </div>

        {/* Bloco 2: Especificação do Produto a Produzir */}
        <div className="border border-slate-300 p-3 mb-3 text-[11px] space-y-1.5">
          <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
            <div>
              <span className="text-slate-500">Produto: </span>
              <span className="text-xs font-bold text-slate-900">{currentOp.productName}</span>
            </div>
            <div className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 border border-slate-200">
              QTD: {formatNumber(currentOp.quantity)} {currentOp.unit}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-slate-500">Código SKU: </span>
              <span className="font-mono font-bold">{currentOp.productSku}</span>
            </div>
            <div>
              <span className="text-slate-500">Nº Desenho Técnico: </span>
              <span className="font-mono font-bold">{currentOp.drawingRef}</span>
            </div>
            <div>
              <span className="text-slate-500">Engenheiro Responsável: </span>
              <span className="font-medium">{currentOp.responsibleOperator}</span>
            </div>
          </div>

          {currentOp.technicalNotes && (
            <div className="mt-1 pt-1 border-t border-slate-200 text-slate-700 bg-amber-50/50 p-1.5 border border-amber-200/50 rounded-xs">
              <span className="font-bold text-slate-900">Observações Técnicas: </span>
              {currentOp.technicalNotes}
            </div>
          )}
        </div>

        {/* Bloco 3: Roteiro Operacional de Fabricação (Etapas de Chão de Fábrica) */}
        <div className="mb-3">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1 flex items-center justify-between">
            <span>Roteiro de Operações e Apontamentos de Chão de Fábrica</span>
            <span className="font-mono text-[10px] text-slate-500 font-normal">
              Total de Etapas: {currentOp.stages.length}
            </span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="border border-slate-300 p-1.5 text-center w-8">Seq</th>
                <th className="border border-slate-300 p-1.5 text-left">Operação / Descrição da Etapa</th>
                <th className="border border-slate-300 p-1.5 text-left">Centro de Trabalho / Máquina</th>
                <th className="border border-slate-300 p-1.5 text-center w-16">Padrão</th>
                <th className="border border-slate-300 p-1.5 text-left w-24">Data / Hora Início</th>
                <th className="border border-slate-300 p-1.5 text-left w-24">Data / Hora Fim</th>
                <th className="border border-slate-300 p-1.5 text-left w-24">Operador / Visto</th>
                <th className="border border-slate-300 p-1.5 text-center w-14">Visto CQ</th>
              </tr>
            </thead>
            <tbody>
              {currentOp.stages.map((stage, idx) => (
                <tr key={stage.id} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-medium">
                    {stage.name}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-slate-700">
                    {stage.workCenter}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono">
                    {stage.standardMinutes} min
                  </td>
                  <td className="border border-slate-300 p-1.5 font-mono text-[9px] text-slate-600">
                    {stage.status === 'concluido' ? '____/____ __:__' : '____/____ __:__'}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-mono text-[9px] text-slate-600">
                    {stage.completedAt ? formatDate(stage.completedAt) : '____/____ __:__'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-[9px]">
                    {stage.operator || '________________'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono text-[9px]">
                    [ &nbsp; ]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bloco 4: Lista de Materiais e Insumos (BOM) */}
        <div className="mb-3">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
            Lista de Materiais e Lotes de Matéria-Prima (BOM)
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="border border-slate-300 p-1.5 text-left">Código Insumo</th>
                <th className="border border-slate-300 p-1.5 text-left">Descrição do Material</th>
                <th className="border border-slate-300 p-1.5 text-right w-24">Qtd Necessária</th>
                <th className="border border-slate-300 p-1.5 text-left w-28">Nº Lote Almoxarifado</th>
                <th className="border border-slate-300 p-1.5 text-center w-20">Baixa no Estoque</th>
              </tr>
            </thead>
            <tbody>
              {currentOp.materials.map((mat) => (
                <tr key={mat.id} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-mono font-medium">
                    {mat.sku}
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    {mat.name}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                    {mat.requiredQuantity} {mat.unit}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-mono">
                    {mat.batchNumber || 'LT-ALMOX-PCP'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono">
                    {mat.allocated ? '[X] BAIXADO' : '[ ] PENDENTE'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bloco 5: Controle e Liberação da Qualidade */}
        <div className="border border-slate-300 p-3 mb-4 text-[10px]">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
            Registro de Inspeção da Qualidade e Liberação Final
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-200">
            <div>
              <span className="text-slate-500 block">Inspeção Dimensional:</span>
              <span className="font-mono">[ ] APROVADO &nbsp; [ ] REPROVADO</span>
            </div>
            <div>
              <span className="text-slate-500 block">Rugosidade Superficial:</span>
              <span className="font-mono">Ra: ________ µm</span>
            </div>
            <div>
              <span className="text-slate-500 block">Quantidade Conforme:</span>
              <span className="font-mono">________ {currentOp.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Peças Refugadas / Sucata:</span>
              <span className="font-mono">________ {currentOp.unit}</span>
            </div>
          </div>
          {currentOp.qualityCheck?.notes && (
            <div className="mt-2 text-slate-700 bg-slate-50 p-1.5 border border-slate-200">
              <span className="font-bold">Parecer do Inspetor: </span>
              {currentOp.qualityCheck.notes}
            </div>
          )}
        </div>

        {/* Bloco 6: Assinaturas Responsáveis */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-slate-900 text-center text-[10px]">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-mono">
              _________________________________
            </div>
            <div className="font-bold text-slate-900">Planejamento e Controle (PCP)</div>
            <div className="text-slate-500">Emissão e Liberação Técnica</div>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-mono">
              _________________________________
            </div>
            <div className="font-bold text-slate-900">Liderança de Produção</div>
            <div className="text-slate-500">Recebimento e Execução de Fábrica</div>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-mono">
              _________________________________
            </div>
            <div className="font-bold text-slate-900">Inspetor da Qualidade (CQ)</div>
            <div className="text-slate-500">Liberação para Expedição</div>
          </div>
        </div>

        {/* Rodapé da folha */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
          <span>Sistema PCP Industrial · {currentOp.code}</span>
          <span>Impresso em: {formatDateTime(new Date())}</span>
          <span>Página 1 / 1</span>
        </div>
      </div>
    </div>
  );
};
