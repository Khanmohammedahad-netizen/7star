import { supabase } from '../supabase';
import type { Invoice } from '../../types/database';

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
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
