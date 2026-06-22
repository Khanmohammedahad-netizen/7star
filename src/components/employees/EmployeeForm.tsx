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
  phone: z.string().min(3, 'Phone is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  role: z.string().min(1, 'Role is required'),
  nationality: z.string().optional(),
  country_of_work: z.enum(['UAE', 'SA']),
  status: z.enum(['active', 'on_leave', 'terminated']),
  visa_number: z.string().optional(),
  visa_issued_date: z.string().optional(),
  visa_expiry_date: z.string().optional(),
  passport_number: z.string().optional(),
  passport_expiry: z.string().optional(),
  emergency_contact: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const ROLES = ['manager', 'technician', 'laborer', 'driver', 'admin'];

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
      role: 'technician',
      nationality: '',
      country_of_work: 'UAE',
      status: 'active',
      visa_number: '',
      visa_issued_date: '',
      visa_expiry_date: '',
      passport_number: '',
      passport_expiry: '',
      emergency_contact: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      full_name: employee?.full_name ?? '',
      phone: employee?.phone ?? '',
      email: employee?.email ?? '',
      role: employee?.role ?? 'technician',
      nationality: employee?.nationality ?? '',
      country_of_work: employee?.country_of_work ?? 'UAE',
      status: employee?.status ?? 'active',
      visa_number: employee?.visa_number ?? '',
      visa_issued_date: employee?.visa_issued_date ?? '',
      visa_expiry_date: employee?.visa_expiry_date ?? '',
      passport_number: employee?.passport_number ?? '',
      passport_expiry: employee?.passport_expiry ?? '',
      emergency_contact: employee?.emergency_contact ?? '',
    });
  }, [open, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const payload = {
      full_name: values.full_name,
      phone: values.phone,
      email: values.email || null,
      role: values.role,
      nationality: values.nationality || null,
      country_of_work: values.country_of_work,
      status: values.status,
      visa_number: values.visa_number || null,
      visa_issued_date: values.visa_issued_date || null,
      visa_expiry_date: values.visa_expiry_date || null,
      passport_number: values.passport_number || null,
      passport_expiry: values.passport_expiry || null,
      emergency_contact: values.emergency_contact || null,
      user_id: employee?.user_id ?? null,
      photo_url: employee?.photo_url ?? null,
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
          <Input
            label="Phone"
            required
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Nationality" {...register('nationality')} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Role"
            options={ROLES.map((r) => ({
              value: r,
              label: r.charAt(0).toUpperCase() + r.slice(1),
            }))}
            {...register('role')}
          />
          <Select
            label="Country of work"
            options={[
              { value: 'UAE', label: 'UAE' },
              { value: 'SA', label: 'Saudi' },
            ]}
            {...register('country_of_work')}
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'on_leave', label: 'On leave' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            {...register('status')}
          />
        </div>

        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Visa & passport
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Visa number" {...register('visa_number')} />
            <Input
              label="Visa expiry"
              type="date"
              {...register('visa_expiry_date')}
            />
            <Input
              label="Visa issued"
              type="date"
              {...register('visa_issued_date')}
            />
            <Input label="Passport number" {...register('passport_number')} />
            <Input
              label="Passport expiry"
              type="date"
              {...register('passport_expiry')}
            />
            <Input
              label="Emergency contact"
              {...register('emergency_contact')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
