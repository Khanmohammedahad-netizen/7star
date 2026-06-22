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
CREATE INDEX IF NOT EXISTS idx_employees_visa_expiry
  ON employees(visa_expiry_date) WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- Extend events to act as the "project" entity
-- ---------------------------------------------------------------------------
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
