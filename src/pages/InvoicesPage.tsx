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
import { downloadDocumentPdf } from '../components/finance/DocumentPDF';
import {
  getInvoices,
  getInvoice,
  setInvoiceStatus,
  deleteInvoice,
  type InvoiceWithItems,
} from '../lib/api/invoices';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { toast } from 'sonner';
import type { Invoice, InvoiceStatus, CurrencyCode } from '../types/database';

const statusVariant: Record<InvoiceStatus, 'neutral' | 'info' | 'success' | 'error'> = {
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
  const [editing, setEditing] = useState<InvoiceWithItems | null>(null);

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

  // Open a fresh invoice form when arriving from "Generate Invoice".
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
    const full = await getInvoice(inv.id);
    setEditing(full);
    setFormOpen(true);
  };

  const download = async (inv: Invoice) => {
    const full = await getInvoice(inv.id);
    if (!full) return;
    const currency = (full.currency ?? 'AED') as CurrencyCode;
    await downloadDocumentPdf({
      kind: 'Invoice',
      number: full.invoice_number,
      country: full.country ?? 'UAE',
      currency,
      issueDate: full.issue_date,
      secondDateLabel: 'Due date',
      secondDate: full.due_date,
      status: full.status,
      clientName: full.client_name,
      clientContact: full.client_contact,
      items: full.line_items ?? [],
      subtotal: full.subtotal ?? 0,
      vatRate: full.vat_rate ?? 0,
      vatAmount: full.vat_amount ?? 0,
      total: full.total_amount,
      terms: full.terms,
      notes: full.notes,
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
        <Card padding="none" className="overflow-hidden">
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
                      {inv.country && (
                        <span className="mr-2"><CountryFlag country={inv.country} /></span>
                      )}
                      <span className="font-medium text-foreground">
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {inv.client_name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-5 py-3 text-right tnum text-foreground">
                      {formatCurrency(inv.total_amount, inv.currency ?? 'AED')}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[inv.status]}>{inv.status}</Badge>
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
