import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  read_at: string | null;
  created_at: string;
}

const severityDot: Record<string, string> = {
  info: 'bg-primary',
  warning: 'bg-warning',
  critical: 'bg-destructive',
};

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, severity, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      // Table may not exist yet in this environment — fail soft.
      if (!active || error) return;
      setItems((data as NotificationRow[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-lift animate-slide-up">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            {unread > 0 && (
              <span className="text-xs text-muted-foreground">{unread} unread</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                You're all caught up.
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      severityDot[n.severity] ?? 'bg-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-surface-2"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
