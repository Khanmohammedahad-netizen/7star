import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  getNotifications,
  markRead,
  markAllRead,
} from '../lib/api/notifications';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';
import type { Notification, NotificationSeverity } from '../types/database';

const dot: Record<NotificationSeverity, string> = {
  info: 'bg-primary',
  warning: 'bg-warning',
  critical: 'bg-destructive',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getNotifications());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const readOne = async (id: string) => {
    await markRead(id);
    setItems((p) =>
      p.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  const readAll = async () => {
    try {
      await markAllRead();
      setItems((p) =>
        p.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
      toast.success('All marked as read');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Visa expiry, invoice due, and project alerts."
        actions={
          unread > 0 && (
            <Button variant="secondary" onClick={readAll}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Visa-expiry and finance alerts will appear here once the scheduled checks run."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 ${
                  n.read_at ? '' : 'bg-primary/[0.03]'
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.severity]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(n.created_at, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {!n.read_at && (
                  <button
                    onClick={() => readOne(n.id)}
                    aria-label="Mark read"
                    title="Mark read"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
