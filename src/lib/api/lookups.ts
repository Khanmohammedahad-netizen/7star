import { supabase } from '../supabase';
import type { Profile } from '../../types/database';

/** Profiles usable as project managers. */
export async function getManagers(): Promise<Pick<Profile, 'id' | 'full_name' | 'role'>[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name', { ascending: true });
  if (error) return [];
  return (data as Pick<Profile, 'id' | 'full_name' | 'role'>[]) ?? [];
}
