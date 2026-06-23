import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select, Textarea } from '../ui/Select';
import { Button } from '../ui/Button';
import { createClient, updateClient } from '../../lib/api/clients';
import type { Client } from '../../types/database';

const schema = z.object({
  name: z.string().min(2, 'Client name is required'),
  company_name: z.string().optional(),
  representative_name: z.string().optional(),
  representative_phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  region: z.enum(['UAE', 'SAUDI']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  client?: Client | null;
}

export function ClientForm({ open, onClose, onSaved, client }: Props) {
  const editing = !!client;
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
      company_name: '',
      representative_name: '',
      representative_phone: '',
      email: '',
      address: '',
      region: 'UAE',
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: client?.name ?? '',
      company_name: client?.company_name ?? '',
      representative_name: client?.representative_name ?? '',
      representative_phone: client?.representative_phone ?? '',
      email: client?.email ?? '',
      address: client?.address ?? '',
      region: client?.region ?? 'UAE',
      notes: client?.notes ?? '',
    });
  }, [open, client, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const payload = {
      name: values.name,
      company_name: values.company_name || null,
      representative_name: values.representative_name || null,
      representative_phone: values.representative_phone || null,
      email: values.email || null,
      address: values.address || null,
      region: values.region,
      country: values.region === 'SAUDI' ? 'Saudi Arabia' : 'UAE',
      is_active: true,
      notes: values.notes || null,
    };
    try {
      if (editing && client) {
        await updateClient(client.id, payload);
        toast.success('Client updated');
      } else {
        await createClient(payload);
        toast.success('Client created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editing ? 'Edit client' : 'New client'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="client-form" loading={saving}>
            {editing ? 'Save changes' : 'Create client'}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Client name"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Input label="Company name" {...register('company_name')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Representative" {...register('representative_name')} />
          <Input label="Representative phone" {...register('representative_phone')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" {...register('email')} />
          <Select
            label="Region"
            required
            options={[
              { value: 'UAE', label: 'United Arab Emirates' },
              { value: 'SAUDI', label: 'Saudi Arabia' },
            ]}
            {...register('region')}
          />
        </div>
        <Input label="Address" {...register('address')} />
        <Textarea label="Notes" rows={2} {...register('notes')} />
      </form>
    </Modal>
  );
}
