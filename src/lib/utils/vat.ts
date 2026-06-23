import type { Region } from '../../types/database';
import { VAT_RATES } from '../constants';

export interface RawLineItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface ComputedTotals {
  net_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
}

export function lineAmount(item: { quantity: number; rate: number }): number {
  return round2((item.quantity || 0) * (item.rate || 0));
}

export function computeTotals(
  items: RawLineItem[],
  region: Region
): ComputedTotals {
  const net_amount = round2(
    items.reduce((s, i) => s + (i.quantity || 0) * (i.rate || 0), 0)
  );
  const vat_rate = VAT_RATES[region];
  const vat_amount = round2(net_amount * vat_rate);
  const total_amount = round2(net_amount + vat_amount);
  return { net_amount, vat_rate, vat_amount, total_amount };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
