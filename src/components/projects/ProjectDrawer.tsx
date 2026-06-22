import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  MapPin,
  CalendarRange,
  Wallet,
  Users,
  Package,
  ReceiptText,
  ExternalLink,
} from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Avatar } from '../ui/Avatar';
import { CallWhatsappButtons } from '../shared/CallWhatsappButtons';
import { getProject, deleteProject } from '../../lib/api/projects';
import { getAssignments } from '../../lib/api/employees';
import { getProjectMaterials } from '../../lib/api/materials';
import { getInvoicesByProject } from '../../lib/api/invoices';
import { PROJECT_STATUS } from '../../lib/status';
import { COUNTRY_FLAG, CURRENCY_BY_COUNTRY } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminRole } from '../../types/roles';
import type {
  Event,
  ProjectAssignment,
  ProjectMaterial,
  Invoice,
} from '../../types/database';
import { toast } from 'sonner';

type Tab = 'overview' | 'team' | 'materials' | 'invoices';

interface Props {
  projectId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: (project: Event) => void;
  onChanged: () => void;
}

export function ProjectDrawer({
  projectId,
  open,
  onClose,
  onEdit,
  onChanged,
}: Props) {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [project, setProject] = useState<Event | null>(null);
  const [team, setTeam] = useState<ProjectAssignment[]>([]);
  const [materials, setMaterials] = useState<ProjectMaterial[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    setTab('overview');
    (async () => {
      const [p, t, m, inv] = await Promise.all([
        getProject(projectId),
        getAssignments(projectId).catch(() => []),
        getProjectMaterials(projectId).catch(() => []),
        getInvoicesByProject(projectId).catch(() => []),
      ]);
      setProject(p);
      setTeam(t);
      setMaterials(m);
      setInvoices(inv);
      setLoading(false);
    })();
  }, [open, projectId]);

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm(`Delete project "${project.title}"? This cannot be undone.`))
      return;
    try {
      await deleteProject(project.id);
      toast.success('Project deleted');
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const country = project?.country ?? (project?.region === 'saudi' ? 'SA' : 'UAE');
  const currency = CURRENCY_BY_COUNTRY[country];
  const meta = project ? PROJECT_STATUS[project.status] : null;
  const materialsTotal = materials.reduce(
    (s, m) => s + m.quantity * m.unit_cost_snapshot,
    0
  );

  const tabs: { id: Tab; label: string; icon: typeof Users; count?: number }[] =
    [
      { id: 'overview', label: 'Overview', icon: CalendarRange },
      { id: 'team', label: 'Team', icon: Users, count: team.length },
      { id: 'materials', label: 'Materials', icon: Package, count: materials.length },
      { id: 'invoices', label: 'Invoices', icon: ReceiptText, count: invoices.length },
    ];

  return (
    <Drawer open={open} onClose={onClose} width={480}>
      {loading || !project ? (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border p-6 pr-12">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {COUNTRY_FLAG[country]}
              </span>
              {meta && <Badge variant={meta.badge} dot>{meta.label}</Badge>}
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {project.title}
            </h2>
            {project.client?.name && (
              <Link
                to={`/clients/${project.client_id}`}
                className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {project.client.name}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit(project)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Link to={`/invoices?project=${project.id}`}>
                <Button size="sm" variant="secondary">
                  <ReceiptText className="h-4 w-4" /> Generate Invoice
                </Button>
              </Link>
              {isAdminRole(role) && (
                <Button size="sm" variant="ghost" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {t.count ? (
                  <span className="rounded-full bg-surface-2 px-1.5 text-[11px]">
                    {t.count}
                  </span>
                ) : null}
                {tab === t.id && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'overview' && (
              <dl className="space-y-5">
                <Row icon={CalendarRange} label="Dates">
                  {formatDate(project.event_date)}
                  {project.end_date && ` → ${formatDate(project.end_date)}`}
                </Row>
                {project.location && (
                  <Row icon={MapPin} label="Location">
                    <span>{project.location}</span>
                    {project.location_lat && project.location_lng && (
                      <a
                        href={`https://maps.google.com/?q=${project.location_lat},${project.location_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-primary hover:underline"
                      >
                        Open in Maps
                      </a>
                    )}
                  </Row>
                )}
                {project.budget != null && (
                  <Row icon={Wallet} label="Budget">
                    <span className="tnum">
                      {formatCurrency(project.budget, currency)}
                    </span>
                  </Row>
                )}
                {project.manager?.full_name && (
                  <Row icon={Users} label="Manager">
                    {project.manager.full_name}
                  </Row>
                )}
                {project.description && (
                  <div>
                    <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </dt>
                    <dd className="whitespace-pre-wrap text-sm text-foreground">
                      {project.description}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {tab === 'team' && (
              <div className="space-y-3">
                {team.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No team members assigned yet.
                  </p>
                ) : (
                  team.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <Avatar name={a.employee?.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {a.employee?.full_name}
                          {a.is_manager && (
                            <Badge variant="primary" size="sm" className="ml-2">
                              Manager
                            </Badge>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.role_on_project || a.employee?.role}
                        </p>
                      </div>
                      <CallWhatsappButtons phone={a.employee?.phone} />
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'materials' && (
              <div>
                {materials.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No materials allocated.
                  </p>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="pb-2 font-medium">Material</th>
                          <th className="pb-2 text-right font-medium">Qty</th>
                          <th className="pb-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((m) => (
                          <tr key={m.id} className="border-b border-border">
                            <td className="py-2 text-foreground">
                              {m.material?.name ?? '—'}
                            </td>
                            <td className="py-2 text-right tnum text-muted-foreground">
                              {m.quantity} {m.material?.unit}
                            </td>
                            <td className="py-2 text-right tnum text-foreground">
                              {formatCurrency(
                                m.quantity * m.unit_cost_snapshot,
                                currency
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
                      <span>Total</span>
                      <span className="tnum">
                        {formatCurrency(materialsTotal, currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'invoices' && (
              <div className="space-y-2">
                {invoices.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No invoices linked to this project.
                  </p>
                ) : (
                  invoices.map((inv) => (
                    <Link
                      key={inv.id}
                      to={`/invoices/${inv.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-surface-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {inv.invoice_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(inv.total_amount, currency)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'overdue'
                            ? 'error'
                            : 'neutral'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
      </div>
    </div>
  );
}
