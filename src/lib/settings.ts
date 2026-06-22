import type { CountryCode } from '../types/database';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
}

export interface AppSettings {
  companyName: string;
  bank: Record<CountryCode, BankDetails>;
  whatsappEnabled: boolean;
  brevoInvoiceTemplate: string;
  brevoVisaTemplate: string;
}

const KEY = 'sevenstar-settings';

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Seven Star Management',
  bank: {
    UAE: { bankName: '', accountName: 'Seven Star Management', accountNumber: '', iban: '' },
    SA: { bankName: '', accountName: 'Seven Star Management', accountNumber: '', iban: '' },
  },
  whatsappEnabled: false,
  brevoInvoiceTemplate: '',
  brevoVisaTemplate: '',
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as AppSettings) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
