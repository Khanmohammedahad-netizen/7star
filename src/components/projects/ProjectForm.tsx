import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select, Textarea } from '../ui/Select';
import { Button } from '../ui/Button';
import {
  createProject,
  updateProject,
  type ProjectInput,
} from '../../lib/api/projects';
import { getClients } from '../../lib/api/clients';
import { getManagers } from '../../lib/api/lookups';
import { PROJECT_STATUSES } from '../../lib/status';
import { PROJECT_STATUS } from '../../lib/status';
import { regionToCountry } from '../../lib/constants';
import type { Client, Event } from '../../types/database';

const schema = z
  .object({
    title: z.string().min(2, 'Name is required'),
    region: z.enum(['uae', 'saudi']),
    status: z.enum([
      'draft',
      'planned',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
    ]),
    event_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional(),
    client_id: z.string().optional(),
    manager_id: z.string().optional(),
    budget: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (d) => !d.end_date || d.end_date >= d.event_date,
    { message: 'End date must be after start date', path: ['end_date'] }
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  project?: Event | null;
}

export function ProjectForm({ open, onClose, onSaved, project }: Props) {
  const editing = !!project;
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<
    { id: string; full_name: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      region: 'uae',
      status: 'draft',
      event_date: '',
      end_date: '',
      client_id: '',
      manager_id: '',
      budget: '',
      location: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    getClients().then(setClients).catch(() => setClients([]));
    getManagers()
      .then((m) => setManagers(m.map((x) => ({ id: x.id, full_name: x.full_name }))))
      .catch(() => setManagers([]));
    reset({
      title: project?.title ?? '',
      region: project?.region ?? 'uae',
      status: project?.status ?? 'draft',
      event_date: project?.event_date?.slice(0, 10) ?? '',
      end_date: project?.end_date?.slice(0, 10) ?? '',
      client_id: project?.client_id ?? '',
      manager_id: project?.manager_id ?? '',
      budget: project?.budget != null ? String(project.budget) : '',
      location: project?.location ?? '',
      description: project?.description ?? '',
    });
  }, [open, project, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload: ProjectInput = {
      title: values.title,
      region: values.region,
      country: regionToCountry(values.region),
      status: values.status,
      event_date: values.event_date,
      end_date: values.end_date || null,
      client_id: values.client_id || null,
      manager_id: values.manager_id || null,
      budget: values.budget ? Number(values.budget) : null,
      location: values.location || null,
      description: values.description || null,
    };
    try {
      if (editing && project) {
        await updateProject(project.id, payload);
        toast.success('Project updated');
      } else {
        await createProject(payload);
        toast.success('Project created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project');
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editing ? 'Edit project' : 'New project'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            form="project-form"
            loading={isSubmitting}
          >
            {editing ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form
        id="project-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Input
          label="Project name"
          required
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Region"
            required
            options={[
              { value: 'uae', label: 'UAE' },
              { value: 'saudi', label: 'Saudi Arabia' },
            ]}
            {...register('region')}
          />
          <Select
            label="Status"
            required
            options={PROJECT_STATUSES.map((s) => ({
              value: s,
              label: PROJECT_STATUS[s].label,
            }))}
            {...register('status')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start date"
            type="date"
            required
            error={errors.event_date?.message}
            {...register('event_date')}
          />
          <Input
            label="End date"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Client"
            placeholder="— None —"
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
            {...register('client_id')}
          />
          <Select
            label="Manager"
            placeholder="— Unassigned —"
            options={managers.map((m) => ({
              value: m.id,
              label: m.full_name,
            }))}
            {...register('manager_id')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Budget"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register('budget')}
          />
          <Input label="Location" {...register('location')} />
        </div>

        <Textarea
          label="Notes"
          rows={3}
          {...register('description')}
        />
      </form>
    </Modal>
  );
}
