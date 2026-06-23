import type { Region, CurrencyCode } from '../types/database';

export const REGIONS: Region[] = ['UAE', 'SAUDI'];

export const VAT_RATES: Record<Region, number> = {
  UAE: 0.05,
  SAUDI: 0.15,
};

export const CURRENCY_BY_REGION: Record<Region, CurrencyCode> = {
  UAE: 'AED',
  SAUDI: 'SAR',
};

export const REGION_LABEL: Record<Region, string> = {
  UAE: 'United Arab Emirates',
  SAUDI: 'Saudi Arabia',
};

export const REGION_FLAG: Record<Region, string> = {
  UAE: '🇦🇪',
  SAUDI: '🇸🇦',
};

export function regionCurrency(region?: string | null): CurrencyCode {
  return region === 'SAUDI' ? 'SAR' : 'AED';
}
