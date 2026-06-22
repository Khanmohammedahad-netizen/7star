-- Seven Star ERP — apply in Supabase Dashboard > SQL Editor.
-- Run top to bottom. Idempotent & non-destructive (safe to re-run).
-- ============ 1/2 SCHEMA ============
/*
  # Seven Star ERP — additive schema (Phase 1)

  Non-destructive. Extends the existing mvp schema (profiles, events,
  materials, payments, invoices) with the CRM/ERP entities from the master
  prompt. The existing `events` table is treated as the "project" entity.

  Nothing is dropped or renamed. All objects use IF NOT EXISTS / guards so the
  migration is idempotent and safe to re-run.
*/

-- ---------------------------------------------------------------------------
-- Enums (guarded — CREATE TYPE has no IF NOT EXISTS)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE country_code AS ENUM ('UAE', 'SA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('draft','sent','accepted','rejected','expired','paid','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE currency_code AS ENUM ('AED', 'SAR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('visa_expiry','passport_expiry','invoice_due','quotation_expiry','project_starting');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('cash','bank','investment','loan','credit_card');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE txn_type AS ENUM ('credit', 'debit', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- profiles: widen role set + personal PIN (non-destructive)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin','admin','senior_manager','manager','staff'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_pin_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country country_code;

-- ---------------------------------------------------------------------------
-- Clients + representatives
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country country_code NOT NULL DEFAULT 'UAE',
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reconcile clients if an older version of the table already exists
-- (CREATE TABLE IF NOT EXISTS above is a no-op when the table pre-dates this).
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country country_code NOT NULL DEFAULT 'UAE';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS client_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_reps_client ON client_representatives(client_id);

-- ---------------------------------------------------------------------------
-- Employees (workforce + visa/passport tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'technician',
  nationality text,
  country_of_work country_code NOT NULL DEFAULT 'UAE',
  visa_number text,
  visa_issued_date date,
  visa_expiry_date date,
  passport_number text,
  passport_expiry date,
  emergency_contact text,
  photo_url text,
  status employee_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
-- Reconcile employees if an older version of the table already exists
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'technician';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS country_of_work country_code NOT NULL DEFAULT 'UAE';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visa_number text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visa_issued_date date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS visa_expiry_date date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_number text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_expiry date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status employee_status DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_employees_visa_expiry
  ON employees(visa_expiry_date) WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- Extend events to act as the "project" entity
-- ---------------------------------------------------------------------------
-- Widen the status palette to match the calendar (draft/confirmed added)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft','planned','confirmed','in_progress','completed','cancelled'));

ALTER TABLE events ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS representative_id uuid REFERENCES client_representatives(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS country country_code;
ALTER TABLE events ADD COLUMN IF NOT EXISTS budget numeric;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_lat numeric;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_lng numeric;

CREATE TABLE IF NOT EXISTS project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES events(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id),
  role_on_project text,
  is_manager boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (project_id, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_assignments_project ON project_assignments(project_id);

-- ---------------------------------------------------------------------------
-- Materials catalogue + per-project allocation
-- (Existing event-scoped `materials` table is left untouched.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materials_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE,
  unit text NOT NULL DEFAULT 'pcs',
  unit_cost numeric DEFAULT 0,
  stock_qty numeric DEFAULT 0,
  country country_code,
  supplier text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES events(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials_catalog(id),
  quantity numeric NOT NULL,
  unit_cost_snapshot numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_materials_project ON project_materials(project_id);

-- ---------------------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  project_id uuid REFERENCES events(id),
  client_id uuid REFERENCES clients(id),
  representative_id uuid REFERENCES client_representatives(id),
  country country_code NOT NULL DEFAULT 'UAE',
  currency currency_code NOT NULL DEFAULT 'AED',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date NOT NULL DEFAULT (CURRENT_DATE + 30),
  status doc_status DEFAULT 'draft',
  subtotal numeric DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 0.05,
  vat_amount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  terms text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Reconcile quotations if an older version of the table already exists
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quote_number text;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES events(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS representative_id uuid REFERENCES client_representatives(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS country country_code NOT NULL DEFAULT 'UAE';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS currency currency_code NOT NULL DEFAULT 'AED';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS issue_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS valid_until date NOT NULL DEFAULT (CURRENT_DATE + 30);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS status doc_status DEFAULT 'draft';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 0.05;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
DO $$ BEGIN
  ALTER TABLE quotations ADD CONSTRAINT quotations_quote_number_key UNIQUE (quote_number);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS quotation_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quotation_line_items(quotation_id);

-- ---------------------------------------------------------------------------
-- Extend invoices toward the master-prompt shape (non-destructive)
-- ---------------------------------------------------------------------------
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS quotation_id uuid REFERENCES quotations(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS country country_code;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency currency_code DEFAULT 'AED';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 0.05;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_line_items(invoice_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES auth.users(id),
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_table text,
  related_id uuid,
  severity notification_severity DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_unread
  ON notifications(recipient_user_id, read_at) WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- Personal accounts (super_admin only) + transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personal_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) NOT NULL,
  account_name text NOT NULL,
  account_type account_type NOT NULL,
  currency text NOT NULL DEFAULT 'AED',
  opening_balance numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES personal_accounts(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type txn_type NOT NULL,
  amount numeric NOT NULL,
  category text,
  counterparty text,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_personal_txn_account ON personal_transactions(account_id);

-- ---------------------------------------------------------------------------
-- Visa status view
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_employees_visa_status AS
SELECT
  id, full_name, phone, country_of_work, visa_expiry_date,
  (visa_expiry_date - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN visa_expiry_date < CURRENT_DATE THEN 'expired'
    WHEN visa_expiry_date - CURRENT_DATE <= 30 THEN 'critical'
    WHEN visa_expiry_date - CURRENT_DATE <= 60 THEN 'warning'
    WHEN visa_expiry_date - CURRENT_DATE <= 180 THEN 'caution'
    ELSE 'ok'
  END AS visa_status_bucket
FROM employees
WHERE status = 'active' AND visa_expiry_date IS NOT NULL;

-- ---------------------------------------------------------------------------
-- updated_at triggers for tables that have the column
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ 2/2 RLS POLICIES ============
/*
  # Seven Star ERP — RLS policies (Phase 1)

  Enables RLS on all new tables and applies role-scoped policies. Idempotent:
  every policy is dropped-if-exists before being (re)created.

  Role model (from profiles.role):
    super_admin / admin  -> full access
    senior_manager / manager -> directory + finance read/write (region later)
    staff -> limited read
*/

-- Helper: current user's role from profiles
CREATE OR REPLACE FUNCTION current_user_role() RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT current_user_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_staff_or_above() RETURNS boolean AS $$
  SELECT current_user_role() IN ('super_admin','admin','senior_manager','manager','staff');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_transactions ENABLE ROW LEVEL SECURITY;

-- Generic read for authenticated org members + write for managers/admins ------
DO $$
DECLARE
  t text;
  read_tables text[] := ARRAY[
    'clients','client_representatives','employees','project_assignments',
    'materials_catalog','project_materials','quotations','quotation_line_items',
    'invoice_line_items'
  ];
BEGIN
  FOREACH t IN ARRAY read_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON %I;', t, t);
    EXECUTE format($f$CREATE POLICY %I_select ON %I FOR SELECT TO authenticated USING (is_staff_or_above());$f$, t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON %I;', t, t);
    EXECUTE format($f$CREATE POLICY %I_insert ON %I FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('super_admin','admin','senior_manager','manager'));$f$, t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I_update ON %I;', t, t);
    EXECUTE format($f$CREATE POLICY %I_update ON %I FOR UPDATE TO authenticated USING (current_user_role() IN ('super_admin','admin','senior_manager','manager')) WITH CHECK (current_user_role() IN ('super_admin','admin','senior_manager','manager'));$f$, t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON %I;', t, t);
    EXECUTE format($f$CREATE POLICY %I_delete ON %I FOR DELETE TO authenticated USING (is_admin());$f$, t, t);
  END LOOP;
END $$;

-- Quotations: only managers+ can create/update, admins delete -----------------
DROP POLICY IF EXISTS quotations_select ON quotations;
CREATE POLICY quotations_select ON quotations FOR SELECT TO authenticated
  USING (current_user_role() IN ('super_admin','admin','senior_manager','manager'));
DROP POLICY IF EXISTS quotations_insert ON quotations;
CREATE POLICY quotations_insert ON quotations FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('super_admin','admin','senior_manager','manager'));
DROP POLICY IF EXISTS quotations_update ON quotations;
CREATE POLICY quotations_update ON quotations FOR UPDATE TO authenticated
  USING (current_user_role() IN ('super_admin','admin','senior_manager','manager'))
  WITH CHECK (current_user_role() IN ('super_admin','admin','senior_manager','manager'));
DROP POLICY IF EXISTS quotations_delete ON quotations;
CREATE POLICY quotations_delete ON quotations FOR DELETE TO authenticated
  USING (is_admin());

-- Notifications: recipient only ----------------------------------------------
DROP POLICY IF EXISTS notif_select ON notifications;
CREATE POLICY notif_select ON notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS notif_update ON notifications;
CREATE POLICY notif_update ON notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS notif_insert ON notifications;
CREATE POLICY notif_insert ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR recipient_user_id = auth.uid());

-- Personal accounts: super_admin AND owner only ------------------------------
DROP POLICY IF EXISTS pa_all ON personal_accounts;
CREATE POLICY pa_all ON personal_accounts FOR ALL TO authenticated
  USING (current_user_role() = 'super_admin' AND owner_user_id = auth.uid())
  WITH CHECK (current_user_role() = 'super_admin' AND owner_user_id = auth.uid());

DROP POLICY IF EXISTS pt_all ON personal_transactions;
CREATE POLICY pt_all ON personal_transactions FOR ALL TO authenticated
  USING (
    current_user_role() = 'super_admin'
    AND account_id IN (SELECT id FROM personal_accounts WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    current_user_role() = 'super_admin'
    AND account_id IN (SELECT id FROM personal_accounts WHERE owner_user_id = auth.uid())
  );
