import { supabase } from '../supabase';
import type { MaterialCatalogItem, ProjectMaterial } from '../../types/database';

export async function getCatalog(): Promise<MaterialCatalogItem[]> {
  const { data, error } = await supabase
    .from('materials_catalog')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as MaterialCatalogItem[]) ?? [];
}

export async function createCatalogItem(
  input: Omit<MaterialCatalogItem, 'id' | 'created_at'>
): Promise<MaterialCatalogItem> {
  const { data, error } = await supabase
    .from('materials_catalog')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as MaterialCatalogItem;
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const { error } = await supabase.from('materials_catalog').delete().eq('id', id);
  if (error) throw error;
}

export async function getProjectMaterials(
  projectId: string
): Promise<ProjectMaterial[]> {
  const { data, error } = await supabase
    .from('project_materials')
    .select('*, material:materials_catalog(*)')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data as ProjectMaterial[]) ?? [];
}

export async function addProjectMaterial(input: {
  project_id: string;
  material_id: string;
  quantity: number;
  unit_cost_snapshot: number;
  notes?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('project_materials').insert(input);
  if (error) throw error;
}

export async function removeProjectMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('project_materials').delete().eq('id', id);
  if (error) throw error;
}
