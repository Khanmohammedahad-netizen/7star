import { Settings } from 'lucide-react';
import { ComingSoon } from '../components/shared/ComingSoon';

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
