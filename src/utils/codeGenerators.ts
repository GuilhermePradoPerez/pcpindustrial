/**
 * Utilitário central de cálculo e extração do maior índice sequencial numérico
 * para Ordens de Produção (OP-2026-XXX) e Pedidos (PED-2026-XXXX).
 *
 * Substitui contagens simples (COUNT(*)) pela identificação do MAX(sequencial),
 * prevenindo erros de chave duplicada (UNIQUE constraint failed) após exclusões.
 */

export const CURRENT_OPERATING_YEAR = 2026;

/**
 * Normaliza códigos de OP para o padrão formal OP-YYYY-XXX (com padding de no mínimo 3 dígitos).
 * Ex: 'op-2026-1' -> 'OP-2026-001', 'OP-2026-12' -> 'OP-2026-012'
 */
export function normalizeOpCode(rawCode: string, defaultYear: number = CURRENT_OPERATING_YEAR): string {
  if (!rawCode) return '';
  const trimmed = rawCode.trim().toUpperCase();
  const match = trimmed.match(/^OP-(\d{4})-(\d+)$/i);
  if (match) {
    const year = match[1];
    const seq = parseInt(match[2], 10);
    return `OP-${year}-${String(seq).padStart(3, '0')}`;
  }
  // Se informou apenas número ou formato simples sem ano
  const numOnly = trimmed.match(/^OP-?(\d+)$/i);
  if (numOnly) {
    const seq = parseInt(numOnly[1], 10);
    return `OP-${defaultYear}-${String(seq).padStart(3, '0')}`;
  }
  return trimmed;
}

/**
 * Normaliza códigos de Pedidos de Venda para o padrão formal PED-YYYY-XXXX (4 dígitos).
 * Ex: 'ped-2026-5' -> 'PED-2026-0005'
 */
export function normalizeOrderCode(rawCode: string, defaultYear: number = CURRENT_OPERATING_YEAR): string {
  if (!rawCode) return '';
  const trimmed = rawCode.trim().toUpperCase();
  const match = trimmed.match(/^PED-(\d{4})-(\d+)$/i);
  if (match) {
    const year = match[1];
    const seq = parseInt(match[2], 10);
    return `PED-${year}-${String(seq).padStart(4, '0')}`;
  }
  const numOnly = trimmed.match(/^PED-?(\d+)$/i);
  if (numOnly) {
    const seq = parseInt(numOnly[1], 10);
    return `PED-${defaultYear}-${String(seq).padStart(4, '0')}`;
  }
  return trimmed;
}

/**
 * Extrai o maior índice numérico existente e retorna o próximo código de Ordem de Produção (OP-YYYY-XXX).
 * Ex: ['OP-2026-001', 'OP-2026-003'] -> 'OP-2026-004' (mesmo se 'OP-2026-002' foi excluída)
 */
export function calculateNextOpCode(
  existingCodes: string[],
  targetYear: number = CURRENT_OPERATING_YEAR
): string {
  const yearStr = String(targetYear);
  let maxSequential = 0;
  const regex = new RegExp(`^OP-${yearStr}-(\\d+)$`, 'i');

  for (const rawCode of existingCodes) {
    if (!rawCode || typeof rawCode !== 'string') continue;
    const trimmed = rawCode.trim();
    const match = trimmed.match(regex);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSequential) {
        maxSequential = seq;
      }
    }
  }

  const nextSeq = maxSequential + 1;
  const padded = String(nextSeq).padStart(3, '0');
  return `OP-${yearStr}-${padded}`;
}

/**
 * Extrai o maior índice numérico existente e retorna o próximo código de Pedido de Venda (PED-YYYY-XXXX).
 * Ex: ['PED-2026-0001', 'PED-2026-0005'] -> 'PED-2026-0006' (mesmo se 0002, 0003 foram excluídos)
 */
export function calculateNextOrderCode(
  existingCodes: string[],
  targetYear: number = CURRENT_OPERATING_YEAR
): string {
  const yearStr = String(targetYear);
  let maxSequential = 0;
  const regex = new RegExp(`^PED-${yearStr}-(\\d+)$`, 'i');

  for (const rawCode of existingCodes) {
    if (!rawCode || typeof rawCode !== 'string') continue;
    const trimmed = rawCode.trim();
    const match = trimmed.match(regex);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSequential) {
        maxSequential = seq;
      }
    }
  }

  const nextSeq = maxSequential + 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `PED-${yearStr}-${padded}`;
}

/**
 * Valida se um código de OP ou Pedido já está cadastrado na lista,
 * considerando variações de formatação e padding de zeros.
 */
export function isCodeDuplicate(candidateCode: string, existingCodes: string[]): boolean {
  if (!candidateCode) return false;
  const normalizedCandidate = candidateCode.startsWith('OP-')
    ? normalizeOpCode(candidateCode)
    : candidateCode.startsWith('PED-')
    ? normalizeOrderCode(candidateCode)
    : candidateCode.trim().toUpperCase();

  return existingCodes.some((raw) => {
    if (!raw) return false;
    const norm = raw.startsWith('OP-')
      ? normalizeOpCode(raw)
      : raw.startsWith('PED-')
      ? normalizeOrderCode(raw)
      : raw.trim().toUpperCase();
    return norm === normalizedCandidate;
  });
}
