import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { getProfiles, updateProfileRole } from '../lib/api/users';
import { ROLE_LABELS } from '../types/roles';
import type { UserRole } from '../types/roles';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { Profile } from '../types/database';

const ROLE_OPTIONS: UserRole[] = [
  'super_admin',
  'admin',
  'senior_manager',
  'manager',
  'staff',
];

export default function UsersPage() {
  const { user: currentUser, role: currentRole } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProfiles(await getProfiles());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (id: string, role: UserRole) => {
    try {
      await updateProfileRole(id, role);
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role } : p))
      );
      toast.success('Role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  // Only super_admin may assign super_admin.
  const assignableRoles = ROLE_OPTIONS.filter(
    (r) => r !== 'super_admin' || currentRole === 'super_admin'
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description="Team members and their access levels."
      />
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No users found"
          description="Users appear here once they sign up."
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <Card padding="none" className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Region</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const self = p.id === currentUser?.id;
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={p.full_name || p.email} size="sm" />
                            <div>
                              <p className="font-medium text-foreground">
                                {p.full_name || '—'}
                                {self && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 uppercase text-muted-foreground">
                          {p.region}
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={p.role}
                            disabled={self}
                            onChange={(e) =>
                              changeRole(p.id, e.target.value as UserRole)
                            }
                            className="h-9 rounded-lg border border-input bg-surface px-2 text-sm text-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {assignableRoles.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {profiles.map((p) => {
              const self = p.id === currentUser?.id;
              return (
                <Card key={p.id} padding="md" className="border border-border">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={p.full_name || p.email} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {p.full_name || '—'}
                            {self && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs uppercase text-muted-foreground whitespace-nowrap ml-2">
                        {p.region}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Role
                      </label>
                      <select
                        value={p.role}
                        disabled={self}
                        onChange={(e) =>
                          changeRole(p.id, e.target.value as UserRole)
                        }
                        className="h-9 w-full rounded-lg border border-input bg-surface px-2 text-sm text-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {assignableRoles.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
