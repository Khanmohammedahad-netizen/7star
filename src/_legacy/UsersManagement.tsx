import { useState, useEffect } from 'react';
import { Users, UserPlus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { CreateUserModal } from './CreateUserModal';

export function UsersManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'senior_manager' | 'manager'>('all');
  const [filterRegion, setFilterRegion] = useState<'all' | 'uae' | 'saudi'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.contact_number.includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesRegion = filterRegion === 'all' || user.region === filterRegion;
    return matchesSearch && matchesRole && matchesRegion;
  });

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    senior_manager: 'bg-blue-100 text-blue-800',
    manager: 'bg-emerald-100 text-emerald-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
            <p className="text-slate-600 mt-1">Manage system users and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="senior_manager">Senior Manager</option>
              <option value="manager">Manager</option>
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value as typeof filterRegion)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            >
              <option value="all">All Regions</option>
              <option value="uae">UAE</option>
              <option value="saudi">Saudi Arabia</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500">
              {searchTerm || filterRole !== 'all' || filterRegion !== 'all'
                ? 'No users found matching your criteria'
                : 'No users found'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-5 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{user.full_name}</h3>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {user.region.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">{user.contact_number}</div>
                </div>

                <div className="text-xs text-slate-500 pt-3 border-t border-slate-100">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
