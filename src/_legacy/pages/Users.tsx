import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import InviteUserModal from '../components/users/InviteUserModal';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  region: 'UAE' | 'SAUDI';
}

export function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ───────────────── LOAD USERS ───────────────── */
  const loadUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, region')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setUsers(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  /* ───────────────── HARD GUARD ───────────────── */
  if (user?.role !== 'admin') {
    return (
      <div className="mt-24 text-center text-gray-500">
        Access denied
      </div>
    );
  }

  /* ───────────────── UPDATE ROLE ───────────────── */
  const changeRole = async (
    userId: string,
    role: User['role']
  ) => {
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    loadUsers();
  };

  /* ───────────────── UPDATE REGION ───────────────── */
  const changeRegion = async (
    userId: string,
    region: User['region']
  ) => {
    await supabase
      .from('profiles')
      .update({ region })
      .eq('id', userId);

    loadUsers();
  };

  /* ───────────────── UI ───────────────── */
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          Users
        </h2>

        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} className="mr-1" />
          Invite User
        </Button>
      </div>

      {/* USERS TABLE */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading users…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Name</th>
                <th className="text-left py-3">Email</th>
                <th className="text-left py-3">Region</th>
                <th className="text-left py-3">Role</th>
              </tr>
            </thead>

            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-3">
                    {u.full_name || '—'}
                  </td>
                  <td className="py-3 text-gray-600">
                    {u.email}
                  </td>

                  {/* REGION */}
                  <td className="py-3">
                    <select
                      value={u.region}
                      onChange={e =>
                        changeRegion(
                          u.id,
                          e.target.value as User['region']
                        )
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="UAE">UAE</option>
                      <option value="SAUDI">Saudi</option>
                    </select>
                  </td>

                  {/* ROLE */}
                  <td className="py-3">
                    <select
                      value={u.role}
                      onChange={e =>
                        changeRole(
                          u.id,
                          e.target.value as User['role']
                        )
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* INVITE MODAL */}
      {inviteOpen && (
        <InviteUserModal
          onClose={() => {
            setInviteOpen(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
