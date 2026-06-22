import { supabase } from '../supabase';
import type { Notification } from '../../types/database';

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Notification[]) ?? [];
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllRead(): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return;
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
    .eq('recipient_user_id', userRes.user.id);
  if (error) throw error;
}
