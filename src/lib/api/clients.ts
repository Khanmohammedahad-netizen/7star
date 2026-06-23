import { supabase } from '../supabase';
import type { Client } from '../../types/database';

export type ClientInput = Omit<
  Client,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as Client[]) ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Client) ?? null;
}

export async function createClient(input: Partial<ClientInput>): Promise<Client> {
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...input, created_by: userRes.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  id: string,
  input: Partial<ClientInput>
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}
