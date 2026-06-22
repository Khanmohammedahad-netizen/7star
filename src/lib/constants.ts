import type { CountryCode, CurrencyCode } from '../types/database';

export const VAT_RATES: Record<CountryCode, number> = {
  UAE: 0.05,
  SA: 0.15,
};

export const CURRENCY_BY_COUNTRY: Record<CountryCode, CurrencyCode> = {
  UAE: 'AED',
  SA: 'SAR',
};

export const COUNTRY_LABEL: Record<CountryCode, string> = {
  UAE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
};

export const COUNTRY_FLAG: Record<CountryCode, string> = {
  UAE: '🇦🇪',
  SA: '🇸🇦',
};

/** Map the legacy region field to the country code used by new tables. */
export function regionToCountry(region?: string | null): CountryCode {
  return region === 'saudi' ? 'SA' : 'UAE';
}
