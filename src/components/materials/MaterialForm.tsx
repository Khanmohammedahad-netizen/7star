import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select, Textarea } from '../ui/Select';
import { Button } from '../ui/Button';
import { createMaterial, updateMaterial } from '../../lib/api/materials';
import { getProjects } from '../../lib/api/projects';
import type { Material, Event } from '../../types/database';

const schema = z.object({
  material_name: z.string().min(1, 'Name is required'),
  event_id: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.string().optional(),
  unit_cost: z.string().optional(),
  supplier: z.string().optional(),
  region: z.enum(['UAE', 'SAUDI']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
const UNITS = ['pcs', 'm', 'kg', 'set', 'box', 'roll', 'l'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: Material | null;
}

export function MaterialForm({ open, onClose, onSaved, item }: Props) {
  const editing = !!item;
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Event[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      material_name: '',
      event_id: '',
      unit: 'pcs',
      quantity: '1',
      unit_cost: '0',
      supplier: '',
      region: 'UAE',
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    getProjects().then(setProjects).catch(() => setProjects([]));
    reset({
      material_name: item?.material_name ?? '',
      event_id: item?.event_id ?? '',
      unit: item?.unit ?? 'pcs',
      quantity: item?.quantity != null ? String(item.quantity) : '1',
      unit_cost: item?.unit_cost != null ? String(item.unit_cost) : '0',
      supplier: item?.supplier ?? '',
      region: item?.region ?? 'UAE',
      notes: item?.notes ?? '',
    });
  }, [open, item, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const qty = Number(values.quantity) || 0;
    const cost = Number(values.unit_cost) || 0;
    const payload = {
      material_name: values.material_name,
      event_id: values.event_id || null,
      unit: values.unit || null,
      quantity: qty,
      unit_cost: cost,
      unit_price: cost,
      total_cost: qty * cost,
      supplier: values.supplier || null,
      region: values.region,
      is_active: true,
      notes: values.notes || null,
    };
    try {
      if (editing && item) {
        await updateMaterial(item.id, payload);
        toast.success('Material updated');
      } else {
        await createMaterial(payload);
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
          error={errors.material_name?.message}
          {...register('material_name')}
        />
        <Select
          label="Project"
          placeholder="— None —"
          options={projects.map((p) => ({ value: p.id, label: p.title }))}
          {...register('event_id')}
        />
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Unit"
            options={UNITS.map((u) => ({ value: u, label: u }))}
            {...register('unit')}
          />
          <Input label="Quantity" type="number" step="0.01" {...register('quantity')} />
          <Input label="Unit cost" type="number" step="0.01" {...register('unit_cost')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Supplier" {...register('supplier')} />
          <Select
            label="Region"
            options={[
              { value: 'UAE', label: 'UAE' },
              { value: 'SAUDI', label: 'Saudi' },
            ]}
            {...register('region')}
          />
        </div>
        <Textarea label="Notes" rows={2} {...register('notes')} />
      </form>
    </Modal>
  );
}
