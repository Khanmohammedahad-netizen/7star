import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Wallet,
  Banknote,
  Landmark,
  TrendingUp,
  CreditCard,
  HandCoins,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AccountForm } from '../../components/admin/AccountForm';
import { getAccounts } from '../../lib/api/personal';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import type { AccountType, PersonalAccount } from '../../types/database';

const ICONS: Record<AccountType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  investment: TrendingUp,
  loan: HandCoins,
  credit_card: CreditCard,
};

// Naive FX to AED for the net-worth tile.
const FX_TO_AED: Record<string, number> = { AED: 1, SAR: 0.98, USD: 3.67 };

export default function AccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<PersonalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await getAccounts());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const netWorth = accounts.reduce(
    (s, a) => s + a.current_balance * (FX_TO_AED[a.currency] ?? 1),
    0
  );

  return (
    <div>
      <PageHeader
        title="Personal Accounts"
        description="Private financial ledger — visible only to you."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New account
          </Button>
        }
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground" padding="lg">
            <p className="text-sm opacity-80">Total net worth (AED)</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tnum">
              {formatCurrency(netWorth, 'AED')}
            </p>
            <p className="mt-1 text-xs opacity-70">
              {accounts.length} account{accounts.length === 1 ? '' : 's'}
            </p>
          </Card>

          {accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No accounts yet"
              description="Add a cash, bank, or investment account to start tracking."
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4" /> New account
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((a) => {
                const Icon = ICONS[a.account_type];
                return (
                  <Card
                    key={a.id}
                    hover
                    className="cursor-pointer"
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => navigate(`/admin/accounts/${a.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs capitalize text-muted-foreground">
                          {a.account_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        {a.account_name}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tnum">
                        {formatCurrency(a.current_balance, a.currency)}
                      </p>
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <AccountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
