import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getEntries, addEntry, deleteEntry } from '../../lib/api/personal';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PersonalEntry } from '../../types/database';

export default function AccountsPage() {
  const [entries, setEntries] = useState<PersonalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState('');
  const [credit, setCredit] = useState('');
  const [debit, setDebit] = useState('');
  const [mode, setMode] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await getEntries());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const credits = entries.reduce((s, e) => s + (e.credit ?? 0), 0);
    const debits = entries.reduce((s, e) => s + (e.debit ?? 0), 0);
    return { credits, debits, balance: credits - debits };
  }, [entries]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credit && !debit) {
      toast.error('Enter a credit or debit amount');
      return;
    }
    setAdding(true);
    try {
      await addEntry({
        entry_date: date,
        description: desc || null,
        credit: credit ? Number(credit) : null,
        debit: debit ? Number(debit) : null,
        mode_of_payment: mode || null,
      });
      setDesc('');
      setCredit('');
      setDebit('');
      setMode('');
      toast.success('Entry added');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteEntry(id);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Personal Accounts"
        description="Private ledger — visible only to you."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Credits</p>
          <p className="mt-1 text-2xl font-semibold tnum text-success">
            {formatCurrency(totals.credits, 'AED')}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Debits</p>
          <p className="mt-1 text-2xl font-semibold tnum text-destructive">
            {formatCurrency(totals.debits, 'AED')}
          </p>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <p className="text-sm opacity-80">Balance</p>
          <p className="mt-1 text-2xl font-semibold tnum">
            {formatCurrency(totals.balance, 'AED')}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <form onSubmit={submit} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Description" className="sm:col-span-2" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Input label="Credit" type="number" step="0.01" value={credit} onChange={(e) => setCredit(e.target.value)} />
          <Input label="Debit" type="number" step="0.01" value={debit} onChange={(e) => setDebit(e.target.value)} />
          <div className="flex items-end">
            <Button type="submit" className="w-full" loading={adding}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Wallet} title="No entries yet" description="Add your first ledger entry above." />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <Card padding="none" className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 text-right font-medium">Credit</th>
                    <th className="px-5 py-3 text-right font-medium">Debit</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="group border-b border-border last:border-0">
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(e.entry_date)}</td>
                      <td className="px-5 py-3 text-foreground">
                        {e.description || '—'}
                        {e.mode_of_payment && (
                          <span className="ml-2 text-xs text-muted-foreground">{e.mode_of_payment}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tnum text-success">
                        {e.credit ? formatCurrency(e.credit, 'AED') : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tnum text-destructive">
                        {e.debit ? formatCurrency(e.debit, 'AED') : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => remove(e.id)}
                          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 cursor-pointer"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {entries.map((e) => (
              <Card key={e.id} padding="md" className="border border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <p className="font-semibold text-foreground">{formatDate(e.entry_date)}</p>
                    </div>
                    <button
                      onClick={() => remove(e.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="font-medium text-foreground truncate">
                      {e.description || '—'}
                    </p>
                    {e.mode_of_payment && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Payment: {e.mode_of_payment}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Credit</p>
                      <p className="font-semibold tnum text-success">
                        {e.credit ? formatCurrency(e.credit, 'AED') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Debit</p>
                      <p className="font-semibold tnum text-destructive">
                        {e.debit ? formatCurrency(e.debit, 'AED') : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
