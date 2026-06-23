import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { createEmployee, updateEmployee } from '../../lib/api/employees';
import type { Employee } from '../../types/database';

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  position: z.string().optional(),
  region: z.enum(['UAE', 'SAUDI']),
  is_active: z.boolean(),
  emirates_id: z.string().optional(),
  emirates_id_expiry: z.string().optional(),
  visa_number: z.string().optional(),
  visa_expiry: z.string().optional(),
  passport_number: z.string().optional(),
  passport_expiry: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee?: Employee | null;
}

export function EmployeeForm({ open, onClose, onSaved, employee }: Props) {
  const editing = !!employee;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      position: '',
      region: 'UAE',
      is_active: true,
      emirates_id: '',
      emirates_id_expiry: '',
      visa_number: '',
      visa_expiry: '',
      passport_number: '',
      passport_expiry: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      full_name: employee?.full_name ?? '',
      phone: employee?.phone ?? '',
      email: employee?.email ?? '',
      position: employee?.position ?? '',
      region: employee?.region ?? 'UAE',
      is_active: employee?.is_active ?? true,
      emirates_id: employee?.emirates_id ?? '',
      emirates_id_expiry: employee?.emirates_id_expiry ?? '',
      visa_number: employee?.visa_number ?? '',
      visa_expiry: employee?.visa_expiry ?? '',
      passport_number: employee?.passport_number ?? '',
      passport_expiry: employee?.passport_expiry ?? '',
    });
  }, [open, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const payload = {
      full_name: values.full_name,
      phone: values.phone || null,
      email: values.email || null,
      position: values.position || null,
      region: values.region,
      is_active: values.is_active,
      emirates_id: values.emirates_id || null,
      emirates_id_expiry: values.emirates_id_expiry || null,
      visa_number: values.visa_number || null,
      visa_expiry: values.visa_expiry || null,
      passport_number: values.passport_number || null,
      passport_expiry: values.passport_expiry || null,
    };
    try {
      if (editing && employee) {
        await updateEmployee(employee.id, payload);
        toast.success('Employee updated');
      } else {
        await createEmployee(payload);
        toast.success('Employee added');
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
      title={editing ? 'Edit employee' : 'New employee'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" loading={saving}>
            {editing ? 'Save changes' : 'Add employee'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full name"
            required
            error={errors.full_name?.message}
            {...register('full_name')}
          />
          <Input label="Phone" {...register('phone')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Position" {...register('position')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Region"
            options={[
              { value: 'UAE', label: 'UAE' },
              { value: 'SAUDI', label: 'Saudi' },
            ]}
            {...register('region')}
          />
          <label className="flex items-end gap-2 pb-2 text-sm text-foreground">
            <input type="checkbox" {...register('is_active')} /> Active
          </label>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Documents & expiry
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emirates ID" {...register('emirates_id')} />
            <Input label="Emirates ID expiry" type="date" {...register('emirates_id_expiry')} />
            <Input label="Visa number" {...register('visa_number')} />
            <Input label="Visa expiry" type="date" {...register('visa_expiry')} />
            <Input label="Passport number" {...register('passport_number')} />
            <Input label="Passport expiry" type="date" {...register('passport_expiry')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
