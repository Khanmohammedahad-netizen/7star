import { supabase } from '../supabase';
import type { Client, ClientRepresentative } from '../../types/database';

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, representatives:client_representatives(*)')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as Client[]) ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, representatives:client_representatives(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Client) ?? null;
}

export async function createClient(
  input: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'representatives'>
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  id: string,
  input: Partial<Client>
): Promise<Client> {
  const { representatives: _r, ...rest } = input;
  void _r;
  const { data, error } = await supabase
    .from('clients')
    .update(rest)
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

export async function addRepresentative(
  input: Omit<ClientRepresentative, 'id' | 'created_at'>
): Promise<ClientRepresentative> {
  const { data, error } = await supabase
    .from('client_representatives')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as ClientRepresentative;
}

export async function deleteRepresentative(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_representatives')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
