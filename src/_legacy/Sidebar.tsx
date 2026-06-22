import { Calendar, Package, DollarSign, FileText, Users, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'calendar', icon: Calendar, label: 'Events Calendar', roles: ['admin', 'senior_manager', 'manager'] },
    { id: 'materials', icon: Package, label: 'Materials', roles: ['admin', 'senior_manager', 'manager'] },
    { id: 'payments', icon: DollarSign, label: 'Payments', roles: ['admin', 'senior_manager', 'manager'] },
    { id: 'invoices', icon: FileText, label: 'Invoices', roles: ['admin', 'senior_manager', 'manager'] },
    { id: 'users', icon: Users, label: 'Users', roles: ['admin'] },
  ];

  const visibleItems = menuItems.filter(item =>
    item.roles.includes(profile?.role || '')
  );

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="font-bold text-lg">7 Star International</h2>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6">
        <nav className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800">
        <div className="mb-4 p-3 bg-slate-800 rounded-lg">
          <p className="text-sm font-medium">{profile?.full_name}</p>
          <p className="text-xs text-slate-400">{profile?.email}</p>
          <p className="text-xs text-slate-400 mt-1">{profile?.contact_number}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
