import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select, Textarea } from '../ui/Select';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { createCatalogItem } from '../../lib/api/materials';
import type { MaterialCatalogItem } from '../../types/database';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  unit_cost: z.string().optional(),
  stock_qty: z.string().optional(),
  country: z.enum(['UAE', 'SA', '']).optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const UNITS = ['pcs', 'm', 'kg', 'set', 'box', 'roll', 'l'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: MaterialCatalogItem | null;
}

export function MaterialForm({ open, onClose, onSaved, item }: Props) {
  const editing = !!item;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      unit: 'pcs',
      unit_cost: '',
      stock_qty: '',
      country: '',
      supplier: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: item?.name ?? '',
      sku: item?.sku ?? '',
      unit: item?.unit ?? 'pcs',
      unit_cost: item?.unit_cost != null ? String(item.unit_cost) : '',
      stock_qty: item?.stock_qty != null ? String(item.stock_qty) : '',
      country: (item?.country as 'UAE' | 'SA' | undefined) ?? '',
      supplier: item?.supplier ?? '',
      notes: item?.notes ?? '',
    });
  }, [open, item, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const payload = {
      name: values.name,
      sku: values.sku || null,
      unit: values.unit,
      unit_cost: values.unit_cost ? Number(values.unit_cost) : 0,
      stock_qty: values.stock_qty ? Number(values.stock_qty) : 0,
      country: values.country ? (values.country as 'UAE' | 'SA') : null,
      supplier: values.supplier || null,
      notes: values.notes || null,
    };
    try {
      if (editing && item) {
        const { error } = await supabase
          .from('materials_catalog')
          .update(payload)
          .eq('id', item.id);
        if (error) throw error;
        toast.success('Material updated');
      } else {
        await createCatalogItem(payload);
        toast.success('Material added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editing ? 'Edit material' : 'New material'}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="material-form" loading={saving}>
            {editing ? 'Save' : 'Add material'}
          </Button>
        </>
      }
    >
      <form id="material-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="SKU" {...register('sku')} />
          <Select
            label="Unit"
            options={UNITS.map((u) => ({ value: u, label: u }))}
            {...register('unit')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Unit cost"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register('unit_cost')}
          />
          <Input
            label="Stock qty"
            type="number"
            step="0.01"
            {...register('stock_qty')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Country"
            placeholder="— Any —"
            options={[
              { value: 'UAE', label: 'UAE' },
              { value: 'SA', label: 'Saudi' },
            ]}
            {...register('country')}
          />
          <Input label="Supplier" {...register('supplier')} />
        </div>
        <Textarea label="Notes" rows={2} {...register('notes')} />
      </form>
    </Modal>
  );
}
