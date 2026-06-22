import type { EventStatus } from '../types/database';

interface StatusMeta {
  label: string;
  /** FullCalendar event color */
  color: string;
  badge: 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'primary';
  pulse?: boolean;
  strike?: boolean;
}

export const PROJECT_STATUS: Record<EventStatus, StatusMeta> = {
  draft: { label: 'Draft', color: '#94a3b8', badge: 'neutral' },
  planned: { label: 'Planned', color: '#94a3b8', badge: 'neutral' },
  confirmed: { label: 'Confirmed', color: '#3b82f6', badge: 'info' },
  in_progress: {
    label: 'In Progress',
    color: '#f59e0b',
    badge: 'warning',
    pulse: true,
  },
  completed: { label: 'Completed', color: '#10b981', badge: 'success' },
  cancelled: {
    label: 'Cancelled',
    color: '#ef4444',
    badge: 'error',
    strike: true,
  },
};

export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS) as EventStatus[];
