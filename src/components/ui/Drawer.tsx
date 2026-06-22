import { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, children, width = 480 }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="absolute right-0 top-0 flex h-full max-w-full flex-col border-l border-border bg-surface shadow-lift animate-slide-in-right"
        style={{ width }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
