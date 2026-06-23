import { supabase } from '../supabase';
import type { PersonalEntry } from '../../types/database';

export async function getEntries(): Promise<PersonalEntry[]> {
  const { data, error } = await supabase
    .from('personal_accounts')
    .select('*')
    .order('entry_date', { ascending: false });
  if (error) throw error;
  return (data as PersonalEntry[]) ?? [];
}

export async function addEntry(input: {
  entry_date: string;
  description?: string | null;
  credit?: number | null;
  debit?: number | null;
  mode_of_payment?: string | null;
  remarks?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('personal_accounts').insert(input);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('personal_accounts').delete().eq('id', id);
  if (error) throw error;
}
