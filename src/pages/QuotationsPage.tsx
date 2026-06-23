import { useEffect, useState, useCallback } from 'react';
import { Plus, FileText, Download, Pencil, ArrowRightLeft, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CountryFlag } from '../components/shared/CountryFlag';
import { DocumentForm } from '../components/finance/DocumentForm';
import { downloadDocumentPdf } from '../lib/pdf';
import {
  getQuotations,
  deleteQuotation,
  convertQuotationToInvoice,
} from '../lib/api/quotations';
import { regionCurrency, VAT_RATES } from '../lib/constants';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { toast } from 'sonner';
import type { Quotation } from '../types/database';

const statusVariant: Record<string, 'neutral' | 'info' | 'success' | 'error'> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
};

export default function QuotationsPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getQuotations());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (q: Quotation) => {
    await downloadDocumentPdf({
      kind: 'Quotation',
      number: q.quotation_number ?? 'QUOTATION',
      region: q.region,
      currency: regionCurrency(q.region),
      date: q.quotation_date ?? q.created_at,
      clientName: q.client?.name ?? 'Client',
      items: q.items ?? [],
      net: q.net_amount ?? 0,
      vatRate: VAT_RATES[q.region],
      vatAmount: (q.total_amount ?? 0) - (q.net_amount ?? 0),
      total: q.total_amount ?? 0,
    });
  };

  const convert = async (q: Quotation) => {
    try {
      await convertQuotationToInvoice(q.id);
      toast.success('Converted to invoice');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Convert failed');
    }
  };

  const remove = async (q: Quotation) => {
    if (!confirm(`Delete ${q.quotation_number}?`)) return;
    try {
      await deleteQuotation(q.id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Draft, send, and convert quotations."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New quotation
          </Button>
        }
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations yet"
          description="Create your first quotation to send to a client."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New quotation
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <Card padding="none" className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Number</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((q) => (
                    <tr key={q.id} className="group border-b border-border last:border-0 hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <span className="mr-2"><CountryFlag region={q.region} /></span>
                        <span className="font-medium text-foreground">{q.quotation_number}</span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{q.client?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {q.quotation_date ? formatDate(q.quotation_date) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tnum text-foreground">
                        {formatCurrency(q.total_amount ?? 0, regionCurrency(q.region))}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant[q.status] ?? 'neutral'}>{q.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <IconBtn label="Download PDF" onClick={() => download(q)}>
                            <Download className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn label="Edit" onClick={() => { setEditing(q); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </IconBtn>
                          {['sent', 'accepted'].includes(q.status) && (
                            <IconBtn label="Convert to invoice" onClick={() => convert(q)}>
                              <ArrowRightLeft className="h-4 w-4 text-primary" />
                            </IconBtn>
                          )}
                          {isAdminRole(role) && (
                            <IconBtn label="Delete" onClick={() => remove(q)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </IconBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {rows.map((q) => (
              <Card key={q.id} padding="md" className="border border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Number</p>
                      <div className="flex items-center gap-2">
                        <CountryFlag region={q.region} />
                        <span className="font-semibold text-foreground truncate">
                          {q.quotation_number}
                        </span>
                      </div>
                    </div>
                    <Badge variant={statusVariant[q.status] ?? 'neutral'}>{q.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <p className="font-medium truncate">{q.client?.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <p className="font-medium">
                        {q.quotation_date ? formatDate(q.quotation_date) : '—'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-semibold tnum text-foreground">
                      {formatCurrency(q.total_amount ?? 0, regionCurrency(q.region))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => download(q)}
                      className="flex-1 min-w-fit flex items-center gap-2 rounded-lg border border-input bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">Download</span>
                    </button>
                    <button
                      onClick={() => { setEditing(q); setFormOpen(true); }}
                      className="flex-1 min-w-fit flex items-center gap-2 rounded-lg border border-input bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">Edit</span>
                    </button>
                    {['sent', 'accepted'].includes(q.status) && (
                      <button
                        onClick={() => convert(q)}
                        className="flex-1 min-w-fit flex items-center gap-2 rounded-lg border border-primary bg-surface px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-2 transition-colors"
                        title="Convert to invoice"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">Convert</span>
                      </button>
                    )}
                    {isAdminRole(role) && (
                      <button
                        onClick={() => remove(q)}
                        className="flex-1 min-w-fit flex items-center gap-2 rounded-lg border border-destructive bg-surface px-3 py-1.5 text-xs font-medium text-destructive hover:bg-surface-2 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <DocumentForm
        kind="quotation"
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        existing={editing}
      />
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground cursor-pointer"
    >
      {children}
    </button>
  );
}
