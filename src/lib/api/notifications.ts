import { supabase } from '../supabase';
import type { ActivityLog } from '../../types/database';

/** No notifications table in this DB — surface the activity_log as the feed. */
export async function getActivity(limit = 50): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data as ActivityLog[]) ?? [];
}
