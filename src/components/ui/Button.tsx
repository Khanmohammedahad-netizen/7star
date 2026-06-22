import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap';

  const variants: Record<string, string> = {
    primary:
      'bg-primary text-primary-foreground hover:opacity-90 shadow-soft',
    secondary:
      'bg-surface-2 text-foreground hover:bg-muted border border-border',
    outline:
      'bg-transparent text-foreground border border-border hover:bg-surface-2',
    ghost: 'bg-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-soft',
  };

  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
