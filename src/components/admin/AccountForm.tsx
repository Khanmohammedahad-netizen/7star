import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select, Textarea } from '../ui/Select';
import { Button } from '../ui/Button';
import { createAccount } from '../../lib/api/personal';

const schema = z.object({
  account_name: z.string().min(1, 'Name is required'),
  account_type: z.enum(['cash', 'bank', 'investment', 'loan', 'credit_card']),
  currency: z.string().min(1),
  opening_balance: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AccountForm({ open, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      account_name: '',
      account_type: 'bank',
      currency: 'AED',
      opening_balance: '0',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await createAccount({
        account_name: values.account_name,
        account_type: values.account_type,
        currency: values.currency,
        opening_balance: Number(values.opening_balance) || 0,
        notes: values.notes || null,
      });
      toast.success('Account created');
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
      title="New account"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="account-form" loading={saving}>
            Create account
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Account name"
          required
          error={errors.account_name?.message}
          {...register('account_name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'bank', label: 'Bank' },
              { value: 'investment', label: 'Investment' },
              { value: 'loan', label: 'Loan' },
              { value: 'credit_card', label: 'Credit card' },
            ]}
            {...register('account_type')}
          />
          <Select
            label="Currency"
            options={[
              { value: 'AED', label: 'AED' },
              { value: 'SAR', label: 'SAR' },
              { value: 'USD', label: 'USD' },
            ]}
            {...register('currency')}
          />
        </div>
        <Input
          label="Opening balance"
          type="number"
          step="0.01"
          {...register('opening_balance')}
        />
        <Textarea label="Notes" rows={2} {...register('notes')} />
      </form>
    </Modal>
  );
}
