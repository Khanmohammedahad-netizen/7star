import { supabase } from '../supabase';
import type { Event, Region } from '../../types/database';

export interface ProjectInput {
  title: string;
  description?: string | null;
  region: Region;
  event_date: string;
  end_date?: string | null;
  status: string;
  manager_id?: string | null;
  client_id?: string | null;
  location?: string | null;
  venue_name?: string | null;
  type?: string | null;
  budget_total?: number | null;
  expected_guests?: number | null;
  notes?: string | null;
}

const SELECT = `
  *,
  client:clients(id, name, company_name, region),
  manager:profiles!events_manager_id_fkey(id, full_name)
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
