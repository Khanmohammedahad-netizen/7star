import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  draggable?: boolean;
  onDragStart?: () => void;
  onClick?: () => void;
}

const variants: Record<string, string> = {
  success:
    'bg-success/10 text-success border-success/20 dark:text-emerald-300',
  warning:
    'bg-warning/10 text-warning border-warning/20 dark:text-amber-300',
  error:
    'bg-destructive/10 text-destructive border-destructive/20 dark:text-red-300',
  info: 'bg-primary/10 text-primary border-primary/20 dark:text-blue-300',
  primary: 'bg-primary/10 text-primary border-primary/20 dark:text-blue-300',
  neutral:
    'bg-surface-2 text-muted-foreground border-border',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  draggable,
  onDragStart,
  onClick,
}: BadgeProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variants[variant],
        sizes[size],
        onClick && 'cursor-pointer',
        className
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
