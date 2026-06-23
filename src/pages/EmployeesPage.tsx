import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Contact, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { CountryFlag } from '../components/shared/CountryFlag';
import { VisaStatusBadge } from '../components/employees/VisaStatusBadge';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { getEmployees } from '../lib/api/employees';
import { toast } from 'sonner';
import type { Employee } from '../types/database';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEmployees(await getEmployees());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Workforce directory with visa & passport tracking."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New employee
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees…"
          className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Contact}
          title={query ? 'No matching employees' : 'No employees yet'}
          description={query ? 'Try another search.' : 'Add your first team member.'}
          action={
            !query && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> New employee
              </Button>
            )
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Visa</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/employees/${e.id}`)}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.full_name} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">
                            {e.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {e.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">
                      {e.position || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <CountryFlag region={e.region} />
                    </td>
                    <td className="px-5 py-3">
                      <VisaStatusBadge expiryDate={e.visa_expiry} size="sm" />
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={e.is_active ? 'success' : 'neutral'} size="sm">
                        {e.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
