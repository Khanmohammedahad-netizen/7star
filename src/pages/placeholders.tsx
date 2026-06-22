import {
  Package,
  FileText,
  ReceiptText,
  Wallet,
  Bell,
  Settings,
} from 'lucide-react';
import { ComingSoon } from '../components/shared/ComingSoon';

export function MaterialsPage() {
  return (
    <ComingSoon
      title="Materials"
      description="Materials catalogue and per-project allocation."
      icon={Package}
      phase="Phase 4"
    />
  );
}

export function QuotationsPage() {
  return (
    <ComingSoon
      title="Quotations"
      description="Create, send, and convert quotations to invoices."
      icon={FileText}
      phase="Phase 5"
    />
  );
}

export function InvoicesPage() {
  return (
    <ComingSoon
      title="Invoices"
      description="VAT-aware invoicing with branded PDF generation."
      icon={ReceiptText}
      phase="Phase 5"
    />
  );
}

export function AccountsPage() {
  return (
    <ComingSoon
      title="Personal Accounts"
      description="PIN-protected personal finance ledger (super admin)."
      icon={Wallet}
      phase="Phase 7"
    />
  );
}

export function NotificationsPage() {
  return (
    <ComingSoon
      title="Notifications"
      description="Visa expiry, invoice due, and project alerts."
      icon={Bell}
      phase="Phase 6"
    />
  );
}

export function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="VAT rates, branding, bank details, and integrations."
      icon={Settings}
      phase="Phase 8"
    />
  );
}
