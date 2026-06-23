import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ReceiptText, Download, Pencil, CheckCircle2, Trash2 } from 'lucide-react';
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
  getInvoices,
  getInvoice,
  setInvoiceStatus,
  deleteInvoice,
} from '../lib/api/invoices';
import { regionCurrency, VAT_RATES } from '../lib/constants';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { toast } from 'sonner';
import type { Invoice } from '../types/database';

const statusVariant: Record<string, 'neutral' | 'info' | 'success' | 'error'> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  overdue: 'error',
};

export default function InvoicesPage() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getInvoices());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('project')) {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete('project');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = async (inv: Invoice) => {
    setEditing(await getInvoice(inv.id));
    setFormOpen(true);
  };

  const download = async (inv: Invoice) => {
    const full = await getInvoice(inv.id);
    if (!full) return;
    await downloadDocumentPdf({
      kind: 'Tax Invoice',
      number: full.invoice_number ?? full.doc_number ?? 'INVOICE',
      region: full.region,
      currency: regionCurrency(full.region),
      date: full.issue_date ?? full.invoice_date ?? full.created_at,
      clientName: full.client_name ?? full.client?.name ?? 'Client',
      items: full.line_items ?? [],
      net: full.net_amount ?? full.subtotal ?? 0,
      vatRate: VAT_RATES[full.region],
      vatAmount: full.vat_amount ?? 0,
      total: full.total_amount ?? full.total ?? 0,
    });
  };

  const markPaid = async (inv: Invoice) => {
    try {
      await setInvoiceStatus(inv.id, 'paid');
      toast.success('Marked as paid');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const remove = async (inv: Invoice) => {
    if (!confirm(`Delete ${inv.invoice_number}?`)) return;
    try {
      await deleteInvoice(inv.id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="VAT-aware invoicing with branded PDF export."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New invoice
          </Button>
        }
      />

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No invoices yet"
          description="Create an invoice or convert a quotation."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New invoice
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
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => (
                    <tr key={inv.id} className="group border-b border-border last:border-0 hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <span className="mr-2"><CountryFlag region={inv.region} /></span>
                        <span className="font-medium text-foreground">
                          {inv.invoice_number ?? inv.doc_number}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {inv.client_name ?? inv.client?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {inv.due_date ? formatDate(inv.due_date) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tnum text-foreground">
                        {formatCurrency(inv.total_amount ?? 0, regionCurrency(inv.region))}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant[inv.status] ?? 'neutral'}>{inv.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <IconBtn label="Download PDF" onClick={() => download(inv)}>
                            <Download className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn label="Edit" onClick={() => openEdit(inv)}>
                            <Pencil className="h-4 w-4" />
                          </IconBtn>
                          {inv.status !== 'paid' && (
                            <IconBtn label="Mark paid" onClick={() => markPaid(inv)}>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            </IconBtn>
                          )}
                          {isAdminRole(role) && (
                            <IconBtn label="Delete" onClick={() => remove(inv)}>
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
            {rows.map((inv) => (
              <Card key={inv.id} padding="md" className="border border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Number</p>
                      <div className="flex items-center gap-2">
                        <CountryFlag region={inv.region} />
                        <span className="font-semibold text-foreground truncate">
                          {inv.invoice_number ?? inv.doc_number}
                        </span>
                      </div>
                    </div>
                    <Badge variant={statusVariant[inv.status] ?? 'neutral'}>{inv.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <p className="font-medium truncate">
                        {inv.client_name ?? inv.client?.name ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Due</p>
                      <p className="font-medium">
                        {inv.due_date ? formatDate(inv.due_date) : '—'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-semibold tnum text-foreground">
                      {formatCurrency(inv.total_amount ?? 0, regionCurrency(inv.region))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => download(inv)}
                      className="flex-1 min-w-fit flex items-center gap-2 rounded-lg border border-input bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">Download</span>
                    </button>
                    <button
                      onClick={() => openEdit(inv)}
                      className="flex-1 min-w-fit flex items-center gap-2 rounded-lg border border-input bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">Edit</span>
                    </button>
                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => markPaid(inv)}
                        className="flex-1 min-w-fit flex items-center gap-2 rounded-lg border border-success bg-surface px-3 py-1.5 text-xs font-medium text-success hover:bg-surface-2 transition-colors"
                        title="Mark paid"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">Paid</span>
                      </button>
                    )}
                    {isAdminRole(role) && (
                      <button
                        onClick={() => remove(inv)}
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
        kind="invoice"
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
