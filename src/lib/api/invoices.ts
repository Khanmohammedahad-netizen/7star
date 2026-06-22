import { supabase } from '../supabase';
import { nextDocNumber } from '../utils/numbering';
import { computeTotals, lineTotal } from '../utils/vat';
import type {
  Invoice,
  LineItem,
  CountryCode,
  CurrencyCode,
  InvoiceStatus,
} from '../../types/database';
import type { DocLineInput } from './quotations';

const SELECT = `*, client:clients(id, name, country), line_items:invoice_line_items(*)`;

export interface InvoiceWithItems extends Invoice {
  line_items?: LineItem[];
  client?: { id: string; name: string; country: CountryCode };
}

export interface InvoiceInput {
  client_id?: string | null;
  event_id?: string | null;
  client_name: string;
  client_contact: string;
  country: CountryCode;
  currency: CurrencyCode;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  terms?: string | null;
  notes?: string | null;
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(id, name, country)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Invoice[]) ?? [];
}

export async function getInvoicesByProject(
  projectId: string
): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('event_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Invoice[]) ?? [];
}

export async function getInvoice(id: string): Promise<InvoiceWithItems | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (data && Array.isArray((data as InvoiceWithItems).line_items)) {
    (data as InvoiceWithItems).line_items!.sort((a, b) => a.position - b.position);
  }
  return (data as InvoiceWithItems) ?? null;
}

async function writeLineItems(
  invoiceId: string,
  items: DocLineInput[]
): Promise<void> {
  await supabase.from('invoice_line_items').delete().eq('invoice_id', invoiceId);
  if (items.length > 0) {
    await supabase.from('invoice_line_items').insert(
      items.map((it, i) => ({
        invoice_id: invoiceId,
        position: i,
        description: it.description,
        qty: it.qty,
        unit_price: it.unit_price,
        total: lineTotal(it),
      }))
    );
  }
}

export async function createInvoice(
  input: InvoiceInput,
  items: DocLineInput[]
): Promise<InvoiceWithItems> {
  const totals = computeTotals(items, input.country);
  const invoice_number = await nextDocNumber('INV', input.country);
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...input,
      invoice_number,
      subtotal: totals.subtotal,
      vat_rate: totals.vat_rate,
      vat_amount: totals.vat_amount,
      total_amount: totals.total,
      created_by: userRes.user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  await writeLineItems(id, items);
  return (await getInvoice(id))!;
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput,
  items: DocLineInput[]
): Promise<InvoiceWithItems> {
  const totals = computeTotals(items, input.country);
  const { error } = await supabase
    .from('invoices')
    .update({
      ...input,
      subtotal: totals.subtotal,
      vat_rate: totals.vat_rate,
      vat_amount: totals.vat_amount,
      total_amount: totals.total,
    })
    .eq('id', id);
  if (error) throw error;
  await writeLineItems(id, items);
  return (await getInvoice(id))!;
}

export async function setInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<void> {
  const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function recordPayment(
  id: string,
  paidAmount: number,
  method: string
): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({
      paid_amount: paidAmount,
      payment_method: method,
      paid_at: new Date().toISOString(),
      status: 'paid',
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}
