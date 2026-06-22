import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface Option {
  value: string;
  label: string;
}

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className = '', id, ...props },
  ref
) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
          {props.required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border bg-surface px-3 text-sm text-foreground transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive' : 'border-input',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
  }
>(function Textarea({ label, error, className = '', id, ...props }, ref) {
  const taId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={taId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <textarea
        id={taId}
        ref={ref}
        rows={props.rows ?? 3}
        className={cn(
          'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          error ? 'border-destructive' : 'border-input',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
