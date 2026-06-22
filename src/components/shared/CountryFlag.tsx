import { COUNTRY_FLAG, COUNTRY_LABEL } from '../../lib/constants';
import type { CountryCode } from '../../types/database';

interface Props {
  country: CountryCode;
  showLabel?: boolean;
  className?: string;
}

export function CountryFlag({ country, showLabel = false, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span aria-hidden className="text-base leading-none">
        {COUNTRY_FLAG[country]}
      </span>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {COUNTRY_LABEL[country]}
        </span>
      )}
      <span className="sr-only">{COUNTRY_LABEL[country]}</span>
    </span>
  );
}
