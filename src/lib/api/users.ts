import { supabase } from '../supabase';
import type { Profile } from '../../types/database';
import type { UserRole } from '../../types/roles';

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

export async function updateProfileRole(
  id: string,
  role: UserRole
): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}
