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
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { toast } from 'sonner';
import type { DocStatus, Quotation } from '../types/database';

const statusVariant: Record<DocStatus, 'neutral' | 'info' | 'success' | 'error' | 'warning'> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'neutral',
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
      number: q.quote_number,
      country: q.country,
      currency: q.currency,
      issueDate: q.issue_date,
      secondDateLabel: 'Valid until',
      secondDate: q.valid_until,
      status: q.status,
      clientName: q.client?.name ?? 'Client',
      items: q.line_items ?? [],
      subtotal: q.subtotal,
      vatRate: q.vat_rate,
      vatAmount: q.vat_amount,
      total: q.total,
      terms: q.terms,
      notes: q.notes,
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
    if (!confirm(`Delete ${q.quote_number}?`)) return;
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
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Number</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Valid until</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.id} className="group border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <span className="mr-2"><CountryFlag country={q.country} /></span>
                      <span className="font-medium text-foreground">{q.quote_number}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {q.client?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(q.valid_until)}
                    </td>
                    <td className="px-5 py-3 text-right tnum text-foreground">
                      {formatCurrency(q.total, q.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[q.status]}>{q.status}</Badge>
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
