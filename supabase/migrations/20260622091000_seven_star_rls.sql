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
