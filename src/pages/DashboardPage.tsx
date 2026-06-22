import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ReceiptText,
  Users2,
  AlertTriangle,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getVisaStatuses } from '../lib/api/employees';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatDate } from '../lib/utils';

interface Stats {
  events: number;
  upcoming: number;
  invoices: number;
  clients: number | null;
}

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  status: string;
  location: string | null;
}

const statusVariant: Record<
  string,
  'neutral' | 'info' | 'warning' | 'success' | 'error'
> = {
  planned: 'neutral',
  confirmed: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

async function safeCount(table: string): Promise<number | null> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) return null;
  return count ?? 0;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [visaAlerts, setVisaAlerts] = useState<
    { id: string; full_name: string; days_until_expiry: number; visa_status_bucket: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [events, invoices, clients, upcomingRes, visas] = await Promise.all([
        safeCount('events'),
        safeCount('invoices'),
        safeCount('clients'),
        supabase
          .from('events')
          .select('id, title, event_date, status, location')
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(6),
        getVisaStatuses().catch(() => []),
      ]);

      if (!active) return;
      const upcomingRows = (upcomingRes.data as UpcomingEvent[]) ?? [];
      setStats({
        events: events ?? 0,
        upcoming: upcomingRows.length,
        invoices: invoices ?? 0,
        clients,
      });
      setUpcoming(upcomingRows);
      setVisaAlerts(
        visas
          .filter((v) =>
            ['expired', 'critical', 'warning'].includes(v.visa_status_bucket)
          )
          .slice(0, 6)
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const kpis: { label: string; value: string; icon: LucideIcon; to: string }[] =
    [
      {
        label: 'Total Projects',
        value: String(stats?.events ?? 0),
        icon: CalendarDays,
        to: '/',
      },
      {
        label: 'Upcoming',
        value: String(stats?.upcoming ?? 0),
        icon: ArrowUpRight,
        to: '/',
      },
      {
        label: 'Invoices',
        value: String(stats?.invoices ?? 0),
        icon: ReceiptText,
        to: '/invoices',
      },
      {
        label: 'Clients',
        value: stats?.clients == null ? '—' : String(stats.clients),
        icon: Users2,
        to: '/clients',
      },
    ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening across Seven Star operations."
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Link key={kpi.label} to={kpi.to}>
                <Card hover className="group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {kpi.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tnum">
                        {kpi.value}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upcoming projects */}
            <Card className="lg:col-span-2" padding="none">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-base font-semibold text-foreground">
                  Upcoming projects
                </h3>
                <Link
                  to="/"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View calendar
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No upcoming projects scheduled.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {upcoming.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-center justify-between gap-4 px-6 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {ev.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(ev.event_date)}
                          {ev.location ? ` · ${ev.location}` : ''}
                        </p>
                      </div>
                      <Badge variant={statusVariant[ev.status] ?? 'neutral'}>
                        {ev.status.replace('_', ' ')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Visa alerts placeholder */}
            <Card padding="none">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="text-base font-semibold text-foreground">
                  Visa alerts
                </h3>
              </div>
              {visaAlerts.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No visas expiring soon.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {visaAlerts.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <Link
                        to={`/employees/${v.id}`}
                        className="truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {v.full_name}
                      </Link>
                      <Badge
                        variant={
                          v.visa_status_bucket === 'warning' ? 'warning' : 'error'
                        }
                        size="sm"
                      >
                        {v.days_until_expiry < 0
                          ? 'Expired'
                          : `${v.days_until_expiry}d`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
