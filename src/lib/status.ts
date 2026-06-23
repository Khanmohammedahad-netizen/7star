interface StatusMeta {
  label: string;
  color: string; // FullCalendar event color
  badge: 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'primary';
  strike?: boolean;
}

const MAP: Record<string, StatusMeta> = {
  draft: { label: 'Draft', color: '#94a3b8', badge: 'neutral' },
  planning: { label: 'Planning', color: '#94a3b8', badge: 'neutral' },
  confirmed: { label: 'Confirmed', color: '#3b82f6', badge: 'info' },
  in_progress: { label: 'In Progress', color: '#f59e0b', badge: 'warning' },
  completed: { label: 'Completed', color: '#10b981', badge: 'success' },
  cancelled: { label: 'Cancelled', color: '#ef4444', badge: 'error', strike: true },
};

const FALLBACK: StatusMeta = { label: 'Unknown', color: '#94a3b8', badge: 'neutral' };

export function projectStatus(status: string | null | undefined): StatusMeta {
  if (!status) return FALLBACK;
  return MAP[status] ?? { ...FALLBACK, label: status.replace(/_/g, ' ') };
}

export const PROJECT_STATUSES = Object.keys(MAP);
