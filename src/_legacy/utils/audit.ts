import { supabase } from '../services/supabase';

interface AuditUser {
  id: string;
  email?: string;
  role?: string;
  region?: string;
}

export async function logAudit(
  action: string,
  description: string,
  user: AuditUser | null,
  entityId?: string,
  region?: string
) {
  try {
    if (!user) return;

    await supabase.from('audit_logs').insert({
      action,
      description,
      user_id: user.id,
      user_email: user.email ?? null,
      role: user.role ?? null,
      region: region ?? user.region ?? null,
      entity_id: entityId ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Audit logging should NEVER break the app
    console.error('Audit log failed:', err);
  }
}
