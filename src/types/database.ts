import type { UserRole } from './roles';
export type { UserRole };
export type Region = 'uae' | 'saudi';
export type EventStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentType = 'received' | 'pending';
export type PaymentStatus = 'pending' | 'completed' | 'overdue';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  region: Region;
  contact_number: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  region: Region;
  event_date: string;
  end_date: string | null;
  status: EventStatus;
  manager_id: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  manager?: Profile;
}

export interface Material {
  id: string;
  event_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  event_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_date: string;
  payment_method: string | null;
  client_name: string;
  notes: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  event_id: string;
  client_name: string;
  client_contact: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
