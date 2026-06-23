import { supabase } from '../supabase';
import { nextDocNumber } from '../utils/numbering';
import { computeTotals, lineAmount } from '../utils/vat';
import type { Quotation, DocItem, Region } from '../../types/database';

export interface DocLineInput {
  description: string;
  quantity: number;
  rate: number;
}

export interface QuotationInput {
  client_id?: string | null;
  event_id?: string | null;
  region: Region;
  quotation_date: string;
  status: string;
}

const SELECT = `*, client:clients(id, name)`;

function toItems(items: DocLineInput[]): DocItem[] {
  return items.map((it, i) => ({
    serial_no: i + 1,
    description: it.description,
    quantity: it.quantity,
    rate: it.rate,
    amount: lineAmount(it),
  }));
}

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
  return (data as Quotation) ?? null;
}

export async function createQuotation(
  input: QuotationInput,
  items: DocLineInput[]
): Promise<Quotation> {
  const totals = computeTotals(items, input.region);
  const quotation_number = await nextDocNumber('QUO', input.region);
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('quotations')
    .insert({
      ...input,
      quotation_number,
      items: toItems(items),
      net_amount: totals.net_amount,
      total_amount: totals.total_amount,
      created_by: userRes.user?.id ?? null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Quotation;
}

export async function updateQuotation(
  id: string,
  input: QuotationInput,
  items: DocLineInput[]
): Promise<Quotation> {
  const totals = computeTotals(items, input.region);
  const { data, error } = await supabase
    .from('quotations')
    .update({
      ...input,
      items: toItems(items),
      net_amount: totals.net_amount,
      total_amount: totals.total_amount,
    })
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Quotation;
}

export async function setQuotationStatus(
  id: string,
  status: string
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

/** Convert a quotation into a draft invoice (copies jsonb items). */
export async function convertQuotationToInvoice(id: string): Promise<string> {
  const q = await getQuotation(id);
  if (!q) throw new Error('Quotation not found');

  const invoice_number = await nextDocNumber('INV', q.region);
  const due = new Date();
  due.setDate(due.getDate() + 30);

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number,
      doc_number: invoice_number,
      doc_type: 'invoice',
      quotation_id: q.id,
      event_id: q.event_id,
      client_id: q.client_id,
      client_name: q.client?.name ?? 'Client',
      client_contact: '',
      region: q.region,
      issue_date: new Date().toISOString().slice(0, 10),
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      line_items: q.items ?? [],
      net_amount: q.net_amount,
      total_amount: q.total_amount,
      total: q.total_amount,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error) throw error;

  await setQuotationStatus(q.id, 'accepted');
  return (data as { id: string }).id;
}
