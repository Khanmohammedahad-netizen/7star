import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface AuditEntry {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor_id: string | null;
}

export function AuditLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      const loadLogs = async () => {
        setLoading(true);

        const { data } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (data) setLogs(data);
        setLoading(false);
      };

      loadLogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  // 🔐 ADMIN ONLY
  if (user?.role !== 'admin') {
    return (
      <div className="mt-24 text-center text-gray-500">
        You do not have permission to view audit logs.
      </div>
    );
  }

  const badgeVariant = (action: string) => {
    switch (action) {
      case 'ROLE_CHANGE':
        return 'warning';
      case 'USER_INVITED':
        return 'info';
      case 'EVENT_CREATED':
        return 'success';
      case 'EVENT_DELETED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          Audit Log
        </h2>
        <p className="text-sm text-gray-600">
          System-wide activity and permission changes
        </p>
      </div>

      {/* CONTENT */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading audit logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No audit activity found.
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log, index) => (
              <div key={log.id} className="relative">
                {index !== logs.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* DOT */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {log.action.replace('_', ' ')}
                        </h4>
                        <Badge variant={badgeVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </div>

                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    {log.old_value && log.new_value && (
                      <p className="text-sm text-gray-600 mb-1">
                        {log.old_value} → {log.new_value}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Actor ID: {log.actor_id ?? 'System'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
