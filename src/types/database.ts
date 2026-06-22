import type { UserRole } from './roles';
export type { UserRole };
export type Region = 'uae' | 'saudi';
export type CountryCode = 'UAE' | 'SA';
export type CurrencyCode = 'AED' | 'SAR';
export type EventStatus =
  | 'draft'
  | 'planned'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type PaymentType = 'received' | 'pending';
export type PaymentStatus = 'pending' | 'completed' | 'overdue';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type DocStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'paid'
  | 'overdue'
  | 'cancelled';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';
export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type NotificationType =
  | 'visa_expiry'
  | 'passport_expiry'
  | 'invoice_due'
  | 'quotation_expiry'
  | 'project_starting';
export type AccountType = 'cash' | 'bank' | 'investment' | 'loan' | 'credit_card';
export type TxnType = 'credit' | 'debit' | 'transfer';
export type VisaBucket = 'expired' | 'critical' | 'warning' | 'caution' | 'ok';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  region: Region;
  contact_number: string;
  country?: CountryCode | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  region: Region;
  country?: CountryCode | null;
  event_date: string;
  end_date: string | null;
  status: EventStatus;
  manager_id: string | null;
  client_id?: string | null;
  representative_id?: string | null;
  budget?: number | null;
  location: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  manager?: Profile;
  client?: Client;
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
  client_id?: string | null;
  quotation_id?: string | null;
  country?: CountryCode | null;
  currency?: CurrencyCode | null;
  issue_date: string;
  due_date: string;
  subtotal?: number | null;
  vat_rate?: number | null;
  vat_amount?: number | null;
  total_amount: number;
  paid_amount?: number | null;
  paid_at?: string | null;
  payment_method?: string | null;
  terms?: string | null;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;
  position: number;
  description: string;
  qty: number;
  unit_price: number;
  total: number;
}

export interface Client {
  id: string;
  name: string;
  country: CountryCode;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  representatives?: ClientRepresentative[];
}

export interface ClientRepresentative {
  id: string;
  client_id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  role: string;
  nationality: string | null;
  country_of_work: CountryCode;
  visa_number: string | null;
  visa_issued_date: string | null;
  visa_expiry_date: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  emergency_contact: string | null;
  photo_url: string | null;
  status: EmployeeStatus;
  created_at: string;
}

export interface EmployeeVisaStatus {
  id: string;
  full_name: string;
  phone: string;
  country_of_work: CountryCode;
  visa_expiry_date: string;
  days_until_expiry: number;
  visa_status_bucket: VisaBucket;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  role_on_project: string | null;
  is_manager: boolean;
  assigned_at: string;
  employee?: Employee;
}

export interface MaterialCatalogItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  unit_cost: number;
  stock_qty: number;
  country: CountryCode | null;
  supplier: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProjectMaterial {
  id: string;
  project_id: string;
  material_id: string;
  quantity: number;
  unit_cost_snapshot: number;
  notes: string | null;
  created_at: string;
  material?: MaterialCatalogItem;
}

export interface Quotation {
  id: string;
  quote_number: string;
  project_id: string | null;
  client_id: string | null;
  representative_id: string | null;
  country: CountryCode;
  currency: CurrencyCode;
  issue_date: string;
  valid_until: string;
  status: DocStatus;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  terms: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  client?: Client;
  line_items?: LineItem[];
}

export interface Notification {
  id: string;
  recipient_user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_table: string | null;
  related_id: string | null;
  severity: NotificationSeverity;
  read_at: string | null;
  created_at: string;
}

export interface PersonalAccount {
  id: string;
  owner_user_id: string;
  account_name: string;
  account_type: AccountType;
  currency: string;
  opening_balance: number;
  current_balance: number;
  notes: string | null;
  created_at: string;
}

export interface PersonalTransaction {
  id: string;
  account_id: string;
  date: string;
  type: TxnType;
  amount: number;
  category: string | null;
  counterparty: string | null;
  notes: string | null;
  created_at: string;
}
