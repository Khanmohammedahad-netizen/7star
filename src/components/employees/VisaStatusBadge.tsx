import { Badge } from '../ui/Badge';

type VisaBucket = 'expired' | 'critical' | 'warning' | 'caution' | 'ok';

interface Props {
  expiryDate?: string | null;
  size?: 'sm' | 'md';
}

export function computeBucket(expiry?: string | null): {
  bucket: VisaBucket;
  days: number | null;
} {
  if (!expiry) return { bucket: 'ok', days: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  const days = Math.round((exp.getTime() - today.getTime()) / 86_400_000);
  let bucket: VisaBucket;
  if (days < 0) bucket = 'expired';
  else if (days <= 30) bucket = 'critical';
  else if (days <= 60) bucket = 'warning';
  else if (days <= 180) bucket = 'caution';
  else bucket = 'ok';
  return { bucket, days };
}

const VARIANT: Record<
  VisaBucket,
  'success' | 'warning' | 'error' | 'neutral'
> = {
  expired: 'error',
  critical: 'error',
  warning: 'warning',
  caution: 'warning',
  ok: 'success',
};

export function VisaStatusBadge({ expiryDate, size = 'md' }: Props) {
  if (!expiryDate) {
    return (
      <Badge variant="neutral" size={size}>
        No visa
      </Badge>
    );
  }
  const { bucket, days } = computeBucket(expiryDate);
  const label =
    bucket === 'expired'
      ? 'Expired'
      : days === 0
      ? 'Expires today'
      : `${days} day${days === 1 ? '' : 's'} left`;
  return (
    <Badge variant={VARIANT[bucket]} size={size} dot>
      {label}
    </Badge>
  );
}
