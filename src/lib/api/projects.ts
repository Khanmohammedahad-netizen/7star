import { supabase } from '../supabase';
import type { Event, EventStatus } from '../../types/database';

export interface ProjectInput {
  title: string;
  description?: string | null;
  region: 'uae' | 'saudi';
  country?: 'UAE' | 'SA' | null;
  event_date: string;
  end_date?: string | null;
  status: EventStatus;
  manager_id?: string | null;
  client_id?: string | null;
  representative_id?: string | null;
  budget?: number | null;
  location?: string | null;
}

const SELECT = `
  *,
  client:clients(id, name, country, phone, email),
  manager:profiles!events_manager_id_fkey(id, full_name, contact_number, role)
`;

export async function getProjects(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(SELECT)
    .order('event_date', { ascending: true });
  if (error) throw error;
  return (data as Event[]) ?? [];
}

export async function getProject(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Event) ?? null;
}

export async function createProject(input: ProjectInput): Promise<Event> {
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('events')
    .insert({ ...input, created_by: userRes.user?.id ?? null })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Event;
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Event;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
