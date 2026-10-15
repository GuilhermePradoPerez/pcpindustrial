/**
 * Utilitário centralizado e seguro para formatação de datas, prazos e métricas.
 * Trata formatos ISO (YYYY-MM-DDTHH:mm:ss) e Date-only (YYYY-MM-DD) sem deslocamento de timezone.
 */

// Data base do sistema (2026-10-15) com fallback para data do navegador
export const SYSTEM_TODAY = new Date('2026-10-15T00:00:00');

interface ParsedDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number;
  minutes: number;
  seconds: number;
  isValid: boolean;
}

/**
 * Faz parsing seguro de strings de data suportando ISO completo e YYYY-MM-DD simples.
 * Evita o bug comum de timezone onde '2026-10-20' vira '19/10/2026' no fuso horário local.
 */
export function parseDateSafe(input: string | Date | null | undefined): ParsedDate {
  const invalid: ParsedDate = {
    year: 0,
    month: 0,
    day: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isValid: false,
  };

  if (!input) return invalid;

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return invalid;
    return {
      year: input.getFullYear(),
      month: input.getMonth() + 1,
      day: input.getDate(),
      hours: input.getHours(),
      minutes: input.getMinutes(),
      seconds: input.getSeconds(),
      isValid: true,
    };
  }

  const str = String(input).trim();
  if (!str) return invalid;

  // Formato YYYY-MM-DD simples
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10);
    const day = parseInt(dateOnlyMatch[3], 10);
    return {
      year,
      month,
      day,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isValid: true,
    };
  }

  // Formato ISO ou datetime: YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DD HH:mm:ss
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const hours = parseInt(isoMatch[4], 10);
    const minutes = parseInt(isoMatch[5], 10);
    const seconds = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
    return {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      isValid: true,
    };
  }

  // Fallback nativo
  const d = new Date(str);
  if (isNaN(d.getTime())) return invalid;

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    isValid: true,
  };
}

/**
 * Formata data no padrão brasileiro DD/MM/YYYY.
 */
export function formatDate(input: string | Date | null | undefined): string {
  const parsed = parseDateSafe(input);
  if (!parsed.isValid) return '—';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}/${mm}/${parsed.year}`;
}

/**
 * Formata data e hora no padrão DD/MM/YYYY às HH:mm.
 */
export function formatDateTime(input: string | Date | null | undefined): string {
  const parsed = parseDateSafe(input);
  if (!parsed.isValid) return '—';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  const hh = String(parsed.hours).padStart(2, '0');
  const min = String(parsed.minutes).padStart(2, '0');
  return `${dd}/${mm}/${parsed.year} às ${hh}:${min}`;
}

/**
 * Formata data no padrão DD/MM para tabelas compactas.
 */
export function formatDateShort(input: string | Date | null | undefined): string {
  const parsed = parseDateSafe(input);
  if (!parsed.isValid) return '—';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}/${mm}`;
}

/**
 * Formata para atributo value de inputs <input type="date"> (YYYY-MM-DD).
 */
export function formatDateForInput(input: string | Date | null | undefined): string {
  const parsed = parseDateSafe(input);
  if (!parsed.isValid) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const y = parsed.year;
  const m = String(parsed.month).padStart(2, '0');
  const d = String(parsed.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type DeadlineStatusKey = 'concluido' | 'cancelado' | 'atrasado' | 'atencao' | 'no_prazo';

export interface DeadlineInfo {
  statusKey: DeadlineStatusKey;
  label: string;
  daysDiff: number;
  formattedDate: string;
  badgeClass: string;
  textClass: string;
  isOverdue: boolean;
}

/**
 * Calcula o status de prazo e dias restantes em relação à data atual do sistema.
 */
export function getDeadlineStatus(
  deadlineInput: string | Date | null | undefined,
  orderStatus?: string,
  referenceDateInput?: string | Date
): DeadlineInfo {
  const formattedDate = formatDate(deadlineInput);
  const parsedDeadline = parseDateSafe(deadlineInput);

  if (!parsedDeadline.isValid) {
    return {
      statusKey: 'no_prazo',
      label: 'Sem prazo estipulado',
      daysDiff: 0,
      formattedDate: '—',
      badgeClass: 'bg-slate-100 text-slate-700',
      textClass: 'text-slate-600',
      isOverdue: false,
    };
  }

  // Se já está concluída ou cancelada
  const normalizedStatus = (orderStatus || '').toLowerCase();
  if (normalizedStatus === 'concluida' || normalizedStatus === 'concluída') {
    return {
      statusKey: 'concluido',
      label: 'Concluída',
      daysDiff: 0,
      formattedDate,
      badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
      textClass: 'text-emerald-700',
      isOverdue: false,
    };
  }

  if (normalizedStatus === 'cancelada') {
    return {
      statusKey: 'cancelado',
      label: 'Cancelada',
      daysDiff: 0,
      formattedDate,
      badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
      textClass: 'text-rose-700',
      isOverdue: false,
    };
  }

  // Base de comparação: data informada ou data atual do sistema
  const refDate = referenceDateInput ? new Date(referenceDateInput) : SYSTEM_TODAY;
  const deadlineDate = new Date(parsedDeadline.year, parsedDeadline.month - 1, parsedDeadline.day);
  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.round((deadlineDate.getTime() - refMidnight.getTime()) / msPerDay);

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return {
      statusKey: 'atrasado',
      label: overdueDays === 1 ? 'Atrasado há 1 dia' : `Atrasado há ${overdueDays} dias`,
      daysDiff,
      formattedDate,
      badgeClass: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 font-medium',
      textClass: 'text-red-700 font-semibold',
      isOverdue: true,
    };
  }

  if (daysDiff === 0) {
    return {
      statusKey: 'atencao',
      label: 'Vence hoje',
      daysDiff,
      formattedDate,
      badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 font-medium',
      textClass: 'text-amber-700 font-semibold',
      isOverdue: false,
    };
  }

  if (daysDiff <= 2) {
    return {
      statusKey: 'atencao',
      label: daysDiff === 1 ? 'Vence amanhã' : `Vence em ${daysDiff} dias`,
      daysDiff,
      formattedDate,
      badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
      textClass: 'text-amber-700',
      isOverdue: false,
    };
  }

  return {
    statusKey: 'no_prazo',
    label: `${daysDiff} dias restantes`,
    daysDiff,
    formattedDate,
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    textClass: 'text-slate-700',
    isOverdue: false,
  };
}

/**
 * Formata valores monetários em Real (BRL).
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata números inteiros ou decimais com separador de milhar brasileiro.
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Retorna classe e rótulo amigável para status de Ordens de Produção.
 */
export function getOpStatusMeta(status: string): {
  label: string;
  badgeClass: string;
  sectorLabel: string;
} {
  const norm = (status || '').toLowerCase().trim();
  switch (norm) {
    case 'planejada':
      return {
        label: 'Planejada',
        badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
        sectorLabel: 'PCP / Engenharia',
      };
    case 'aguardando_insumos':
    case 'aguardando insumos':
      return {
        label: 'Aguardando Insumos',
        badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
        sectorLabel: 'Almoxarifado',
      };
    case 'em_producao':
    case 'em produção':
    case 'producao':
      return {
        label: 'Em Produção',
        badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
        sectorLabel: 'Chão de Fábrica',
      };
    case 'controle_qualidade':
    case 'qualidade':
      return {
        label: 'Controle de Qualidade',
        badgeClass: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
        sectorLabel: 'Inspeção CQ',
      };
    case 'concluida':
    case 'concluída':
      return {
        label: 'Concluída',
        badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
        sectorLabel: 'Expedição',
      };
    case 'cancelada':
      return {
        label: 'Cancelada',
        badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
        sectorLabel: 'Cancelamento',
      };
    default:
      return {
        label: status || 'Desconhecido',
        badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
        sectorLabel: 'Geral',
      };
  }
}
