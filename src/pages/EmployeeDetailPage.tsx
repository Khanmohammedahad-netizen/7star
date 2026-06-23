import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { CountryFlag } from '../components/shared/CountryFlag';
import { CallWhatsappButtons } from '../components/shared/CallWhatsappButtons';
import { VisaStatusBadge } from '../components/employees/VisaStatusBadge';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { getEmployee, deleteEmployee } from '../lib/api/employees';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';
import type { Employee } from '../types/database';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || '—'}</dd>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setEmployee(await getEmployee(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!employee) return;
    if (!confirm(`Delete ${employee.full_name}?`)) return;
    try {
      await deleteEmployee(employee.id);
      toast.success('Employee deleted');
      navigate('/employees');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!employee) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Employee not found.</p>
        <Link to="/employees" className="mt-2 inline-block text-primary">
          Back to employees
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/employees"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Employees
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={employee.full_name} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {employee.full_name}
            </h1>
            <p className="mt-0.5 flex items-center gap-2 text-sm capitalize text-muted-foreground">
              {employee.position || 'Employee'}
              <CountryFlag region={employee.region} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CallWhatsappButtons phone={employee.phone} />
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          {isAdminRole(role) && (
            <Button variant="ghost" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Visa status</h3>
            <VisaStatusBadge expiryDate={employee.visa_expiry} />
          </div>
          <dl className="space-y-3">
            <Field label="Visa number" value={employee.visa_number} />
            <Field
              label="Visa expiry"
              value={employee.visa_expiry && formatDate(employee.visa_expiry)}
            />
            <Field label="Emirates ID" value={employee.emirates_id} />
            <Field
              label="Emirates ID expiry"
              value={
                employee.emirates_id_expiry && formatDate(employee.emirates_id_expiry)
              }
            />
          </dl>
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Passport</h3>
          <dl className="space-y-3">
            <Field label="Passport number" value={employee.passport_number} />
            <Field
              label="Passport expiry"
              value={
                employee.passport_expiry && formatDate(employee.passport_expiry)
              }
            />
          </dl>
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Contact</h3>
          <dl className="space-y-3">
            <Field label="Phone" value={employee.phone} />
            <Field label="Email" value={employee.email} />
            <Field
              label="Status"
              value={
                <Badge variant={employee.is_active ? 'success' : 'neutral'} size="sm">
                  {employee.is_active ? 'Active' : 'Inactive'}
                </Badge>
              }
            />
          </dl>
        </Card>
      </div>

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        employee={employee}
      />
    </div>
  );
}
