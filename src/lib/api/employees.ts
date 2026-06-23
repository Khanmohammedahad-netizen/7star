import { supabase } from '../supabase';
import type { Employee } from '../../types/database';

export type EmployeeInput = Omit<
  Employee,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return (data as Employee[]) ?? [];
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Employee) ?? null;
}

export async function createEmployee(
  input: Partial<EmployeeInput>
): Promise<Employee> {
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('employees')
    .insert({ ...input, created_by: userRes.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>
): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}
