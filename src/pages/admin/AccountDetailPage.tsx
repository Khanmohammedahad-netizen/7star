import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import {
  getAccount,
  getTransactions,
  addTransaction,
} from '../../lib/api/personal';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import type { PersonalAccount, PersonalTransaction } from '../../types/database';

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<PersonalAccount | null>(null);
  const [txns, setTxns] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [acc, t] = await Promise.all([getAccount(id), getTransactions(id)]);
    setAccount(acc);
    setTxns(t);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Running balance (ascending), displayed descending.
  const rows = useMemo(() => {
    if (!account) return [];
    const asc = [...txns].sort((a, b) => a.date.localeCompare(b.date));
    let bal = account.opening_balance;
    const withBal = asc.map((t) => {
      bal += t.type === 'debit' ? -t.amount : t.amount;
      return { ...t, balance: bal };
    });
    return withBal.reverse();
  }, [txns, account]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !amount) return;
    setAdding(true);
    try {
      await addTransaction({
        account_id: id,
        date,
        type,
        amount: Number(amount),
        category: category || null,
        counterparty: counterparty || null,
      });
      setAmount('');
      setCategory('');
      setCounterparty('');
      toast.success('Transaction added');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!account) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Account not found.</p>
        <Link to="/admin/accounts" className="mt-2 inline-block text-primary">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/accounts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Accounts
      </Link>

      <PageHeader
        title={account.account_name}
        description={`${account.account_type.replace('_', ' ')} · ${account.currency}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <p className="text-sm text-muted-foreground">Current balance</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground tnum">
            {formatCurrency(account.current_balance, account.currency)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Opening: {formatCurrency(account.opening_balance, account.currency)}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3 border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-foreground">
              Add transaction
            </h4>
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as 'credit' | 'debit')}
              options={[
                { value: 'credit', label: 'Credit (in)' },
                { value: 'debit', label: 'Debit (out)' },
              ]}
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              label="Counterparty"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={adding}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </Card>

        <Card padding="none" className="lg:col-span-2">
          <h3 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
            Ledger ({txns.length})
          </h3>
          {rows.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={t.type === 'debit' ? 'error' : 'success'}
                          size="sm"
                        >
                          {t.category || t.type}
                        </Badge>
                        {t.counterparty && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {t.counterparty}
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-5 py-3 text-right tnum ${
                          t.type === 'debit' ? 'text-destructive' : 'text-success'
                        }`}
                      >
                        {t.type === 'debit' ? '−' : '+'}
                        {formatCurrency(t.amount, account.currency)}
                      </td>
                      <td className="px-5 py-3 text-right tnum text-foreground">
                        {formatCurrency(t.balance, account.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
