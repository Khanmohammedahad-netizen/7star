import { useEffect, useState, useCallback } from 'react';
import { Bell, Activity } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { getActivity } from '../lib/api/notifications';
import { formatDate } from '../lib/utils';
import type { ActivityLog } from '../types/database';

export default function NotificationsPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await getActivity());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Recent activity across the workspace."
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing here yet"
          description="Activity entries will appear here as work happens."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.description && (
                    <p className="text-sm text-muted-foreground">{n.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.type ? `${n.type} · ` : ''}
                    {formatDate(n.created_at, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
