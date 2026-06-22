import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from '../shared/NotificationBell';
import { Avatar } from '../ui/Avatar';
import { ROLE_LABELS } from '../../types/roles';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border glass px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground lg:hidden cursor-pointer"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface py-1 pl-1 pr-2 transition-colors hover:bg-surface-2 cursor-pointer"
          >
            <Avatar name={profile?.full_name || profile?.email} size="sm" />
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lift animate-slide-up">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-medium text-foreground">
                  {profile?.full_name || 'User'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile?.email}
                </p>
                {role && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {ROLE_LABELS[role]}
                  </p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
