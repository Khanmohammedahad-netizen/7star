import { supabase } from '../supabase';
import type {
  Employee,
  EmployeeVisaStatus,
  ProjectAssignment,
} from '../../types/database';

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
  input: Omit<Employee, 'id' | 'created_at'>
): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function updateEmployee(
  id: string,
  input: Partial<Employee>
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

export async function getVisaStatuses(): Promise<EmployeeVisaStatus[]> {
  const { data, error } = await supabase
    .from('v_employees_visa_status')
    .select('*')
    .order('days_until_expiry', { ascending: true });
  if (error) return [];
  return (data as EmployeeVisaStatus[]) ?? [];
}

// --- Project team assignments ---------------------------------------------
export async function getAssignments(
  projectId: string
): Promise<ProjectAssignment[]> {
  const { data, error } = await supabase
    .from('project_assignments')
    .select('*, employee:employees(*)')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data as ProjectAssignment[]) ?? [];
}

export async function addAssignment(input: {
  project_id: string;
  employee_id: string;
  role_on_project?: string | null;
  is_manager?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('project_assignments').insert(input);
  if (error) throw error;
}

export async function removeAssignment(id: string): Promise<void> {
  const { error } = await supabase
    .from('project_assignments')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
