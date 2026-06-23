import type { UserRole } from './roles';
export type { UserRole };

export type Region = 'UAE' | 'SAUDI';
export type CurrencyCode = 'AED' | 'SAR';
/** events.status is free text; these are the values seen in production. */
export type EventStatus =
  | 'draft'
  | 'planning'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type DocStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  region: Region;
  contact_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  company_name: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  email: string | null;
  address: string | null;
  region: Region;
  country: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  emirates_id: string | null;
  emirates_id_expiry: string | null;
  emirates_id_image_url: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  passport_image_url: string | null;
  visa_number: string | null;
  visa_expiry: string | null;
  position: string | null;
  region: Region;
  is_active: boolean;
  created_by: string | null;
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
  event_end_date: string | null;
  status: EventStatus | string;
  manager_id: string | null;
  client_id: string | null;
  location: string | null;
  venue_name: string | null;
  type: string | null;
  expected_guests: number | null;
  staff_count: number | null;
  budget_total: number | null;
  color: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: Pick<Client, 'id' | 'name' | 'company_name' | 'region'> | null;
  manager?: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface Material {
  id: string;
  event_id: string | null;
  material_name: string;
  description: string | null;
  size: string | null;
  quantity: number;
  unit: string | null;
  unit_cost: number | null;
  unit_price: number | null;
  total_cost: number | null;
  supplier: string | null;
  region: Region | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

/** Shared jsonb line-item shape for quotations.items / invoices.line_items */
export interface DocItem {
  serial_no?: number;
  description: string;
  size?: string | null;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotation_number: string | null;
  event_id: string | null;
  client_id: string | null;
  items: DocItem[] | null;
  net_amount: number | null;
  total_amount: number | null;
  quotation_date: string | null;
  status: DocStatus | string;
  region: Region;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: Pick<Client, 'id' | 'name'> | null;
}

export interface Invoice {
  id: string;
  invoice_number: string | null;
  doc_number: string | null;
  doc_type: string | null;
  event_id: string | null;
  client_id: string | null;
  quotation_id: string | null;
  client_name: string | null;
  client_contact: string | null;
  issue_date: string | null;
  invoice_date: string | null;
  due_date: string | null;
  line_items: DocItem[] | null;
  subtotal: number | null;
  net_amount: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  total: number | null;
  amount_paid: number | null;
  balance: number | null;
  status: DocStatus | string;
  region: Region;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Pick<Client, 'id' | 'name'> | null;
}

export interface Payment {
  id: string;
  event_id: string | null;
  invoice_id: string | null;
  amount: number;
  payment_type: string | null;
  payment_date: string | null;
  payment_method: string | null;
  payment_mode: string | null;
  client_name: string | null;
  status: string | null;
  region: Region | null;
  notes: string | null;
  created_at: string;
}

/** personal_accounts is a flat single-ledger table. */
export interface PersonalEntry {
  id: string;
  entry_date: string;
  description: string | null;
  credit: number | null;
  debit: number | null;
  mode_of_payment: string | null;
  remarks: string | null;
  created_at: string;
}

export interface CompanyEntry {
  id: string;
  entry_date: string;
  project_name: string | null;
  expense_head: string | null;
  description: string | null;
  amount: number | null;
  vat: number | null;
  total: number | null;
  mode_of_payment: string | null;
  invoice_available: boolean | null;
  invoice_date: string | null;
  region: Region | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  org_id: string | null;
  type: string | null;
  title: string;
  description: string | null;
  created_at: string;
}
