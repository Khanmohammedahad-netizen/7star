import { supabase } from '../supabase';
import type { Region } from '../../types/database';

type DocType = 'INV' | 'QUO';

/**
 * Generate the next document number: {TYPE}-{REGION}-{YYYY}-{SEQ:04d}.
 * Sequence is per (type, region, year), derived from a prefix count.
 */
export async function nextDocNumber(
  type: DocType,
  region: Region
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${type}-${region}-${year}-`;
  const table = type === 'INV' ? 'invoices' : 'quotations';
  const column = type === 'INV' ? 'invoice_number' : 'quotation_number';

  const { count, error } = await supabase
    .from(table)
    .select(column, { count: 'exact', head: true })
    .like(column, `${prefix}%`);

  const seq = (error ? 0 : count ?? 0) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}
