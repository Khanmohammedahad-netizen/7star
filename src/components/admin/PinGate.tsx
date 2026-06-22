import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPinHash, setPinHash } from '../../lib/api/personal';
import { hashPin, isUnlocked, markUnlocked } from '../../lib/pin';
import { Spinner } from '../ui/Spinner';
import { toast } from 'sonner';

export function PinGate() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isUnlocked()) {
      setUnlocked(true);
      setChecking(false);
      return;
    }
    if (!user) return;
    getPinHash(user.id)
      .then((h) => setHasPin(!!h))
      .finally(() => setChecking(false));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const hash = await hashPin(pin);
      if (hasPin) {
        const stored = await getPinHash(user.id);
        if (stored !== hash) {
          setError('Incorrect PIN.');
          setBusy(false);
          return;
        }
      } else {
        if (pin !== confirm) {
          setError('PINs do not match.');
          setBusy(false);
          return;
        }
        await setPinHash(user.id, hash);
        toast.success('PIN set');
      }
      markUnlocked();
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (unlocked) return <Outlet />;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-2xl border border-border bg-surface p-6 text-center shadow-card"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {hasPin ? 'Enter your PIN' : 'Set a personal PIN'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasPin
            ? 'Personal accounts are protected.'
            : 'Choose a 4-digit PIN to protect this area.'}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <input
          inputMode="numeric"
          maxLength={4}
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="mt-4 h-12 w-full rounded-lg border border-input bg-surface text-center text-2xl tracking-[0.5em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {!hasPin && (
          <input
            inputMode="numeric"
            maxLength={4}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
            placeholder="Confirm"
            className="mt-3 h-12 w-full rounded-lg border border-input bg-surface text-center text-2xl tracking-[0.5em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 cursor-pointer"
        >
          {hasPin ? 'Unlock' : 'Set PIN & continue'}
        </button>
      </form>
    </div>
  );
}
