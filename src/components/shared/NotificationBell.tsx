import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getActivity } from '../../lib/api/notifications';
import { formatDate } from '../../lib/utils';
import type { ActivityLog } from '../../types/database';

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityLog[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getActivity(10).then((rows) => {
      if (active) setItems(rows);
    });
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
        aria-label="Activity"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
      >
        <Bell className="h-[18px] w-[18px]" />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-lift animate-slide-up">
          <div className="border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Activity</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing yet.
              </p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.description && (
                    <p className="text-xs text-muted-foreground">{n.description}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDate(n.created_at)}
                  </p>
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
