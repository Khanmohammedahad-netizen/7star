import type { CountryCode } from '../../types/database';
import { VAT_RATES } from '../constants';

export interface RawLineItem {
  description: string;
  qty: number;
  unit_price: number;
}

export interface ComputedTotals {
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
}

export function lineTotal(item: { qty: number; unit_price: number }): number {
  return round2((item.qty || 0) * (item.unit_price || 0));
}

export function computeTotals(
  items: RawLineItem[],
  country: CountryCode
): ComputedTotals {
  const subtotal = round2(
    items.reduce((s, i) => s + (i.qty || 0) * (i.unit_price || 0), 0)
  );
  const vat_rate = VAT_RATES[country];
  const vat_amount = round2(subtotal * vat_rate);
  const total = round2(subtotal + vat_amount);
  return { subtotal, vat_rate, vat_amount, total };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
