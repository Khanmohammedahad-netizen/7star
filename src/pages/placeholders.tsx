import { Wallet, Settings } from 'lucide-react';
import { ComingSoon } from '../components/shared/ComingSoon';

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
