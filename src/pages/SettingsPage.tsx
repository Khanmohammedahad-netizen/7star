import { useState } from 'react';
import { Save, Lock } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getSettings, saveSettings, type AppSettings } from '../lib/settings';
import { VAT_RATES, COUNTRY_LABEL } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { hashPin } from '../lib/pin';
import { setPinHash } from '../lib/api/personal';
import { toast } from 'sonner';
import type { CountryCode } from '../types/database';

export default function SettingsPage() {
  const { user, role } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [newPin, setNewPin] = useState('');

  const save = () => {
    saveSettings(settings);
    toast.success('Settings saved');
  };

  const updateBank = (
    country: CountryCode,
    field: keyof AppSettings['bank']['UAE'],
    value: string
  ) => {
    setSettings((s) => ({
      ...s,
      bank: { ...s.bank, [country]: { ...s.bank[country], [field]: value } },
    }));
  };

  const changePin = async () => {
    if (!user) return;
    if (!/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be 4 digits');
      return;
    }
    try {
      await setPinHash(user.id, await hashPin(newPin));
      setNewPin('');
      toast.success('PIN updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Company, finance, and integration preferences."
        actions={
          <Button onClick={save}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
          <Input
            label="Company name"
            value={settings.companyName}
            onChange={(e) =>
              setSettings((s) => ({ ...s, companyName: e.target.value }))
            }
          />
        </Card>

        <Card>
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            VAT rates
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Fixed by jurisdiction and applied automatically.
          </p>
          <div className="flex gap-6">
            {(Object.keys(VAT_RATES) as CountryCode[]).map((c) => (
              <div key={c} className="text-sm">
                <span className="text-muted-foreground">{COUNTRY_LABEL[c]}: </span>
                <span className="font-semibold text-foreground">
                  {(VAT_RATES[c] * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {(Object.keys(settings.bank) as CountryCode[]).map((c) => (
          <Card key={c}>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Bank details — {COUNTRY_LABEL[c]}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bank name"
                value={settings.bank[c].bankName}
                onChange={(e) => updateBank(c, 'bankName', e.target.value)}
              />
              <Input
                label="Account name"
                value={settings.bank[c].accountName}
                onChange={(e) => updateBank(c, 'accountName', e.target.value)}
              />
              <Input
                label="Account number"
                value={settings.bank[c].accountNumber}
                onChange={(e) => updateBank(c, 'accountNumber', e.target.value)}
              />
              <Input
                label="IBAN"
                value={settings.bank[c].iban}
                onChange={(e) => updateBank(c, 'iban', e.target.value)}
              />
            </div>
          </Card>
        ))}

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Integrations
          </h3>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={settings.whatsappEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, whatsappEnabled: e.target.checked }))
              }
            />
            Enable WhatsApp alerts
          </label>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input
              label="Brevo invoice template ID"
              value={settings.brevoInvoiceTemplate}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  brevoInvoiceTemplate: e.target.value,
                }))
              }
            />
            <Input
              label="Brevo visa-alert template ID"
              value={settings.brevoVisaTemplate}
              onChange={(e) =>
                setSettings((s) => ({ ...s, brevoVisaTemplate: e.target.value }))
              }
            />
          </div>
        </Card>

        {role === 'super_admin' && (
          <Card>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock className="h-4 w-4" /> Personal accounts PIN
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Set or change the 4-digit PIN protecting your personal accounts.
            </p>
            <div className="flex items-end gap-3">
              <Input
                label="New PIN"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="max-w-[140px]"
              />
              <Button variant="secondary" onClick={changePin}>
                Update PIN
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
