import { supabase } from '../supabase';
import type { CountryCode } from '../../types/database';

type DocType = 'INV' | 'QUO';

/**
 * Generate the next document number: {TYPE}-{COUNTRY}-{YYYY}-{SEQ:04d}.
 * Sequence is per (type, country, year), derived from a prefix count.
 * Not transaction-safe under heavy concurrency, but adequate for v1.
 */
export async function nextDocNumber(
  type: DocType,
  country: CountryCode
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${type}-${country}-${year}-`;
  const table = type === 'INV' ? 'invoices' : 'quotations';
  const column = type === 'INV' ? 'invoice_number' : 'quote_number';

  const { count, error } = await supabase
    .from(table)
    .select(column, { count: 'exact', head: true })
    .like(column, `${prefix}%`);

  const seq = (error ? 0 : count ?? 0) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}
