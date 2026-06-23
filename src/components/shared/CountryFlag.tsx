import { REGION_FLAG, REGION_LABEL } from '../../lib/constants';
import type { Region } from '../../types/database';

interface Props {
  region: Region;
  showLabel?: boolean;
  className?: string;
}

/** Region flag (kept the filename for import stability). */
export function CountryFlag({ region, showLabel = false, className = '' }: Props) {
  const safe: Region = region === 'SAUDI' ? 'SAUDI' : 'UAE';
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span aria-hidden className="text-base leading-none">
        {REGION_FLAG[safe]}
      </span>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{REGION_LABEL[safe]}</span>
      )}
      <span className="sr-only">{REGION_LABEL[safe]}</span>
    </span>
  );
}
