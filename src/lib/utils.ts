export type ClassValue = string | false | null | undefined;

/** Lightweight classNames joiner (no external deps). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(
  amount: number,
  currency = 'AED',
  locale = 'en-AE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', opts).format(d);
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty',
  'Ninety',
];

function threeDigitsToWords(n: number): string {
  let out = '';
  if (n >= 100) {
    out += ONES[Math.floor(n / 100)] + ' Hundred';
    n %= 100;
    if (n) out += ' ';
  }
  if (n >= 20) {
    out += TENS[Math.floor(n / 10)];
    if (n % 10) out += '-' + ONES[n % 10];
  } else if (n > 0) {
    out += ONES[n];
  }
  return out;
}

/** Convert a money amount to words, e.g. "AED Twenty-Three Thousand Only". */
export function amountToWords(amount: number, currency = 'AED'): string {
  const whole = Math.floor(Math.abs(amount || 0));
  const fils = Math.round((Math.abs(amount || 0) - whole) * 100);
  if (whole === 0 && fils === 0) return `${currency} Zero Only`;

  const scales = ['', ' Thousand', ' Million', ' Billion'];
  const groups: number[] = [];
  let n = whole;
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    words += threeDigitsToWords(groups[i]) + scales[i];
    if (i > 0) words += ' ';
  }
  words = words.trim() || 'Zero';
  let result = `${currency} ${words}`;
  if (fils > 0) result += ` and ${fils}/100`;
  return result + ' Only';
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
