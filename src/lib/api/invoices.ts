import { supabase } from '../supabase';
import { nextDocNumber } from '../utils/numbering';
import { computeTotals, lineAmount } from '../utils/vat';
import type { Invoice, DocItem, Region } from '../../types/database';
import type { DocLineInput } from './quotations';

const SELECT = `*, client:clients(id, name)`;

export interface InvoiceInput {
  client_id?: string | null;
  event_id?: string | null;
  client_name: string;
  client_contact: string;
  region: Region;
  issue_date: string;
  due_date: string;
  status: string;
  notes?: string | null;
}

function toItems(items: DocLineInput[]): DocItem[] {
  return items.map((it, i) => ({
    serial_no: i + 1,
    description: it.description,
    quantity: it.quantity,
    rate: it.rate,
    amount: lineAmount(it),
  }));
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Invoice[]) ?? [];
}

export async function getInvoicesByProject(eventId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Invoice[]) ?? [];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Invoice) ?? null;
}

export async function createInvoice(
  input: InvoiceInput,
  items: DocLineInput[]
): Promise<Invoice> {
  const totals = computeTotals(items, input.region);
  const invoice_number = await nextDocNumber('INV', input.region);
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...input,
      invoice_number,
      doc_number: invoice_number,
      doc_type: 'invoice',
      invoice_date: input.issue_date,
      line_items: toItems(items),
      net_amount: totals.net_amount,
      vat_amount: totals.vat_amount,
      total_amount: totals.total_amount,
      total: totals.total_amount,
      subtotal: totals.net_amount,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Invoice;
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput,
  items: DocLineInput[]
): Promise<Invoice> {
  const totals = computeTotals(items, input.region);
  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...input,
      invoice_date: input.issue_date,
      line_items: toItems(items),
      net_amount: totals.net_amount,
      vat_amount: totals.vat_amount,
      total_amount: totals.total_amount,
      total: totals.total_amount,
      subtotal: totals.net_amount,
    })
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Invoice;
}

export async function setInvoiceStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}
