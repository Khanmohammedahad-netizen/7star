import { supabase } from '../supabase';
import { nextDocNumber } from '../utils/numbering';
import { computeTotals, lineTotal } from '../utils/vat';
import type {
  Quotation,
  CountryCode,
  CurrencyCode,
  DocStatus,
  LineItem,
} from '../../types/database';

export interface DocLineInput {
  description: string;
  qty: number;
  unit_price: number;
}

export interface QuotationInput {
  client_id?: string | null;
  project_id?: string | null;
  representative_id?: string | null;
  country: CountryCode;
  currency: CurrencyCode;
  issue_date: string;
  valid_until: string;
  status: DocStatus;
  terms?: string | null;
  notes?: string | null;
}

const SELECT = `*, client:clients(id, name, country), line_items:quotation_line_items(*)`;

export async function getQuotations(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Quotation[]) ?? [];
}

export async function getQuotation(id: string): Promise<Quotation | null> {
  const { data, error } = await supabase
    .from('quotations')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (data && Array.isArray((data as Quotation).line_items)) {
    (data as Quotation).line_items!.sort((a, b) => a.position - b.position);
  }
  return (data as Quotation) ?? null;
}

async function writeLineItems(
  quotationId: string,
  items: DocLineInput[]
): Promise<void> {
  await supabase
    .from('quotation_line_items')
    .delete()
    .eq('quotation_id', quotationId);
  if (items.length > 0) {
    await supabase.from('quotation_line_items').insert(
      items.map((it, i) => ({
        quotation_id: quotationId,
        position: i,
        description: it.description,
        qty: it.qty,
        unit_price: it.unit_price,
        total: lineTotal(it),
      }))
    );
  }
}

export async function createQuotation(
  input: QuotationInput,
  items: DocLineInput[]
): Promise<Quotation> {
  const totals = computeTotals(items, input.country);
  const quote_number = await nextDocNumber('QUO', input.country);
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('quotations')
    .insert({
      ...input,
      quote_number,
      ...totals,
      created_by: userRes.user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  await writeLineItems(id, items);
  return (await getQuotation(id))!;
}

export async function updateQuotation(
  id: string,
  input: QuotationInput,
  items: DocLineInput[]
): Promise<Quotation> {
  const totals = computeTotals(items, input.country);
  const { error } = await supabase
    .from('quotations')
    .update({ ...input, ...totals })
    .eq('id', id);
  if (error) throw error;
  await writeLineItems(id, items);
  return (await getQuotation(id))!;
}

export async function setQuotationStatus(
  id: string,
  status: DocStatus
): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase.from('quotations').delete().eq('id', id);
  if (error) throw error;
}

/** Convert an accepted/sent quotation into a new invoice (+ copy line items). */
export async function convertQuotationToInvoice(
  quotationId: string
): Promise<string> {
  const quote = await getQuotation(quotationId);
  if (!quote) throw new Error('Quotation not found');
  if (!['sent', 'accepted'].includes(quote.status)) {
    throw new Error('Only sent or accepted quotations can be converted.');
  }

  const invoice_number = await nextDocNumber('INV', quote.country);
  const issue = new Date();
  const due = new Date();
  due.setDate(due.getDate() + 30);
  const { data: userRes } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number,
      quotation_id: quote.id,
      event_id: quote.project_id,
      client_id: quote.client_id,
      client_name: quote.client?.name ?? 'Client',
      client_contact: '',
      country: quote.country,
      currency: quote.currency,
      issue_date: issue.toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      subtotal: quote.subtotal,
      vat_rate: quote.vat_rate,
      vat_amount: quote.vat_amount,
      total_amount: quote.total,
      status: 'draft',
      terms: quote.terms,
      notes: quote.notes,
      created_by: userRes.user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const invoiceId = (data as { id: string }).id;

  const items = (quote.line_items ?? []) as LineItem[];
  if (items.length > 0) {
    await supabase.from('invoice_line_items').insert(
      items.map((it, i) => ({
        invoice_id: invoiceId,
        position: i,
        description: it.description,
        qty: it.qty,
        unit_price: it.unit_price,
        total: it.total,
      }))
    );
  }

  await setQuotationStatus(quote.id, 'accepted');
  return invoiceId;
}
