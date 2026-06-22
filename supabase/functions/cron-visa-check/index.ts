// Daily visa-expiry check. Invoked by pg_cron at 09:00 GST (05:00 UTC).
// Inserts notifications for super_admins (deduped 7 days) and, if a Brevo
// API key is configured, emails each super_admin.
//
// Deploy: supabase functions deploy cron-visa-check
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface VisaRow {
  id: string;
  full_name: string;
  country_of_work: 'UAE' | 'SA';
  visa_expiry_date: string;
  days_until_expiry: number;
  visa_status_bucket: string;
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const brevoKey = Deno.env.get('BREVO_API_KEY');
  const brevoTemplate = Deno.env.get('BREVO_VISA_TEMPLATE_ID');

  const supabase = createClient(supabaseUrl, serviceRole);

  // 1. Employees needing attention
  const { data: rows, error } = await supabase
    .from('v_employees_visa_status')
    .select('*')
    .in('visa_status_bucket', ['critical', 'warning', 'expired']);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const visaRows = (rows ?? []) as VisaRow[];

  // 2. Super-admin recipients
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'super_admin');

  const recipients = (admins ?? []) as { id: string; email: string }[];

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  let created = 0;

  for (const emp of visaRows) {
    // 2a. Skip if a recent notification already exists for this employee
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'visa_expiry')
      .eq('related_id', emp.id)
      .gte('created_at', sevenDaysAgo);

    if ((count ?? 0) > 0) continue;

    const expired = emp.days_until_expiry < 0;
    const severity =
      expired || emp.days_until_expiry <= 30 ? 'critical' : 'warning';
    const title = `Visa expiring: ${emp.full_name}`;
    const message = expired
      ? `${emp.full_name}'s visa EXPIRED on ${emp.visa_expiry_date}. Country: ${emp.country_of_work}.`
      : `${emp.full_name}'s visa expires in ${emp.days_until_expiry} days (${emp.visa_expiry_date}). Country: ${emp.country_of_work}.`;

    for (const admin of recipients) {
      await supabase.from('notifications').insert({
        recipient_user_id: admin.id,
        type: 'visa_expiry',
        title,
        message,
        related_table: 'employees',
        related_id: emp.id,
        severity,
      });
      created++;

      // 3. Optional Brevo email
      if (brevoKey && admin.email) {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: [{ email: admin.email }],
            templateId: brevoTemplate ? Number(brevoTemplate) : undefined,
            subject: title,
            htmlContent: `<p>${message}</p>`,
            sender: { name: 'Seven Star ERP', email: 'seven-star@example.com' },
            params: {
              employee: emp.full_name,
              days: emp.days_until_expiry,
              date: emp.visa_expiry_date,
            },
          }),
        }).catch(() => {});
      }
    }
  }

  return new Response(
    JSON.stringify({ checked: visaRows.length, notifications: created }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
