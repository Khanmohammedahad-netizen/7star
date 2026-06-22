import { NavLink } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_SECTIONS } from './nav';
import { ROLE_LABELS } from '../../types/roles';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, role } = useAuth();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || (role && item.roles.includes(role))
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Star className="h-4 w-4" fill="currentColor" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">
                Seven Star
              </div>
              <div className="text-[11px] text-muted-foreground">
                Management ERP
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {visibleSections.map((section, i) => (
            <div key={section.title ?? i}>
              {section.title && (
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={profile?.full_name || profile?.email} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {profile?.full_name || profile?.email || 'User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {role ? ROLE_LABELS[role] : ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
