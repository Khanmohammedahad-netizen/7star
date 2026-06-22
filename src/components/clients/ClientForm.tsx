import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select, Textarea } from '../ui/Select';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { createClient, updateClient } from '../../lib/api/clients';
import type { Client } from '../../types/database';

const repSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name required'),
  phone: z.string().min(3, 'Phone required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  role: z.string().optional(),
  is_primary: z.boolean().optional(),
});

const schema = z.object({
  name: z.string().min(2, 'Client name is required'),
  country: z.enum(['UAE', 'SA']),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  representatives: z.array(repSchema),
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
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      country: 'UAE',
      email: '',
      phone: '',
      address: '',
      notes: '',
      representatives: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'representatives',
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: client?.name ?? '',
      country: client?.country ?? 'UAE',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      address: client?.address ?? '',
      notes: client?.notes ?? '',
      representatives:
        client?.representatives?.map((r) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          email: r.email ?? '',
          role: r.role ?? '',
          is_primary: r.is_primary,
        })) ?? [],
    });
  }, [open, client, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const clientPayload = {
        name: values.name,
        country: values.country,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        notes: values.notes || null,
      };

      let clientId: string;
      if (editing && client) {
        await updateClient(client.id, clientPayload);
        clientId = client.id;
      } else {
        const created = await createClient(clientPayload);
        clientId = created.id;
      }

      // Replace representatives wholesale.
      await supabase
        .from('client_representatives')
        .delete()
        .eq('client_id', clientId);
      if (values.representatives.length > 0) {
        await supabase.from('client_representatives').insert(
          values.representatives.map((r) => ({
            client_id: clientId,
            name: r.name,
            phone: r.phone,
            email: r.email || null,
            role: r.role || null,
            is_primary: r.is_primary ?? false,
          }))
        );
      }

      toast.success(editing ? 'Client updated' : 'Client created');
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
          <Select
            label="Country"
            required
            options={[
              { value: 'UAE', label: 'United Arab Emirates' },
              { value: 'SA', label: 'Saudi Arabia' },
            ]}
            {...register('country')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Phone" {...register('phone')} />
        </div>
        <Input label="Address" {...register('address')} />
        <Textarea label="Notes" rows={2} {...register('notes')} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Representatives
            </h4>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                append({
                  name: '',
                  phone: '',
                  email: '',
                  role: '',
                  is_primary: false,
                })
              }
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div
                key={f.id}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-lg border border-border p-3"
              >
                <Input
                  placeholder="Name"
                  {...register(`representatives.${i}.name`)}
                />
                <Input
                  placeholder="Phone"
                  {...register(`representatives.${i}.phone`)}
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-destructive cursor-pointer"
                  aria-label="Remove representative"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Input
                  placeholder="Email"
                  className="col-span-1"
                  {...register(`representatives.${i}.email`)}
                />
                <Input
                  placeholder="Role"
                  {...register(`representatives.${i}.role`)}
                />
                <label className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    {...register(`representatives.${i}.is_primary`)}
                  />
                  Primary
                </label>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No representatives added.
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
