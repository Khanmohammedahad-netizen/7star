import { supabase } from '../supabase';
import type { Material } from '../../types/database';

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Material[]) ?? [];
}

export async function getProjectMaterials(eventId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Material[]) ?? [];
}

export async function createMaterial(
  input: Partial<Material>
): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Material;
}

export async function updateMaterial(
  id: string,
  input: Partial<Material>
): Promise<void> {
  const { error } = await supabase.from('materials').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}
