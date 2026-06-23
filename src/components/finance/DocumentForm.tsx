import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select, Textarea } from '../ui/Select';
import { Button } from '../ui/Button';
import { getClients } from '../../lib/api/clients';
import { createQuotation, updateQuotation } from '../../lib/api/quotations';
import { createInvoice, updateInvoice } from '../../lib/api/invoices';
import { computeTotals } from '../../lib/utils/vat';
import { regionCurrency } from '../../lib/constants';
import { formatCurrency } from '../../lib/utils';
import type { Client, Region, Quotation, Invoice } from '../../types/database';

const schema = z.object({
  client_id: z.string().optional(),
  region: z.enum(['UAE', 'SAUDI']),
  issue_date: z.string().min(1, 'Required'),
  due_date: z.string().optional(),
  status: z.string(),
  client_contact: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Required'),
        quantity: z.string(),
        rate: z.string(),
      })
    )
    .min(1, 'Add at least one line item'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  kind: 'quotation' | 'invoice';
  open: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
  existing?: Quotation | Invoice | null;
}

function LiveTotals({ control, region }: { control: Control<FormValues>; region: Region }) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const totals = useMemo(
    () =>
      computeTotals(
        items.map((i) => ({
          description: i?.description ?? '',
          quantity: Number(i?.quantity) || 0,
          rate: Number(i?.rate) || 0,
        })),
        region
      ),
    [items, region]
  );
  const currency = regionCurrency(region);
  return (
    <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="tnum">{formatCurrency(totals.net_amount, currency)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>VAT ({(totals.vat_rate * 100).toFixed(0)}%)</span>
        <span className="tnum">{formatCurrency(totals.vat_amount, currency)}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold text-foreground">
        <span>Total</span>
        <span className="tnum">{formatCurrency(totals.total_amount, currency)}</span>
      </div>
    </div>
  );
}

const QUOTE_STATUS = ['draft', 'sent', 'accepted', 'rejected'];
const INVOICE_STATUS = ['draft', 'sent', 'paid', 'overdue'];

export function DocumentForm({ kind, open, onClose, onSaved, existing }: Props) {
  const editing = !!existing;
  const isQuote = kind === 'quotation';
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: '',
      region: 'UAE',
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      status: 'draft',
      client_contact: '',
      notes: '',
      items: [{ description: '', quantity: '1', rate: '0' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const region = (watch('region') as Region) ?? 'UAE';

  useEffect(() => {
    if (!open) return;
    getClients().then(setClients).catch(() => setClients([]));

    const q = existing as Quotation | null;
    const inv = existing as Invoice | null;
    const items = isQuote ? q?.items : inv?.line_items;
    const firstDate = isQuote
      ? q?.quotation_date
      : inv?.issue_date ?? inv?.invoice_date;
    reset({
      client_id: existing?.client_id ?? '',
      region: (existing?.region as Region) ?? 'UAE',
      issue_date: firstDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      due_date: inv?.due_date?.slice(0, 10) ?? '',
      status: existing?.status ?? 'draft',
      client_contact: inv?.client_contact ?? '',
      notes: inv?.notes ?? '',
      items:
        items && items.length > 0
          ? items.map((li) => ({
              description: li.description,
              quantity: String(li.quantity),
              rate: String(li.rate),
            }))
          : [{ description: '', quantity: '1', rate: '0' }],
    });
  }, [open, existing, isQuote, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const items = values.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity) || 0,
      rate: Number(i.rate) || 0,
    }));
    const clientName =
      clients.find((c) => c.id === values.client_id)?.name || 'Client';
    try {
      let id: string;
      if (isQuote) {
        const payload = {
          client_id: values.client_id || null,
          region: values.region,
          quotation_date: values.issue_date,
          status: values.status,
        };
        const res =
          editing && existing
            ? await updateQuotation(existing.id, payload, items)
            : await createQuotation(payload, items);
        id = res.id;
      } else {
        const payload = {
          client_id: values.client_id || null,
          client_name: clientName,
          client_contact: values.client_contact || '',
          region: values.region,
          issue_date: values.issue_date,
          due_date: values.due_date || values.issue_date,
          status: values.status,
          notes: values.notes || null,
        };
        const res =
          editing && existing
            ? await updateInvoice(existing.id, payload, items)
            : await createInvoice(payload, items);
        id = res.id;
      }
      toast.success(
        `${isQuote ? 'Quotation' : 'Invoice'} ${editing ? 'updated' : 'created'}`
      );
      onSaved(id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = (isQuote ? QUOTE_STATUS : INVOICE_STATUS).map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editing ? `Edit ${kind}` : `New ${kind}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="doc-form" loading={saving}>
            {editing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="doc-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Client"
            placeholder="— Select client —"
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
            {...register('client_id')}
          />
          <Select
            label="Region"
            options={[
              { value: 'UAE', label: 'UAE (5% VAT)' },
              { value: 'SAUDI', label: 'Saudi (15% VAT)' },
            ]}
            {...register('region')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label={isQuote ? 'Quotation date' : 'Issue date'}
            type="date"
            error={errors.issue_date?.message}
            {...register('issue_date')}
          />
          {!isQuote && (
            <Input label="Due date" type="date" {...register('due_date')} />
          )}
          <Select label="Status" options={statusOptions} {...register('status')} />
        </div>

        {!isQuote && <Input label="Client contact" {...register('client_contact')} />}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Line items</h4>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => append({ description: '', quantity: '1', rate: '0' })}
            >
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>
          {errors.items?.message && (
            <p className="mb-2 text-sm text-destructive">{errors.items.message}</p>
          )}
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <Input
                  placeholder="Description"
                  className="flex-1"
                  error={errors.items?.[i]?.description?.message}
                  {...register(`items.${i}.description`)}
                />
                <Input placeholder="Qty" type="number" step="0.01" className="w-20" {...register(`items.${i}.quantity`)} />
                <Input placeholder="Rate" type="number" step="0.01" className="w-28" {...register(`items.${i}.rate`)} />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(i)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-destructive cursor-pointer"
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex">
          <LiveTotals control={control} region={region} />
        </div>

        {!isQuote && <Textarea label="Notes" rows={2} {...register('notes')} />}
      </form>
    </Modal>
  );
}
