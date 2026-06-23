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
  Building2,
} from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { getProject, deleteProject } from '../../lib/api/projects';
import { getProjectMaterials } from '../../lib/api/materials';
import { getInvoicesByProject } from '../../lib/api/invoices';
import { projectStatus } from '../../lib/status';
import { REGION_FLAG, regionCurrency } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminRole } from '../../types/roles';
import type { Event, Material, Invoice, Region } from '../../types/database';
import { toast } from 'sonner';

type Tab = 'overview' | 'materials' | 'invoices';

interface Props {
  projectId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: (project: Event) => void;
  onChanged: () => void;
}

export function ProjectDrawer({ projectId, open, onClose, onEdit, onChanged }: Props) {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [project, setProject] = useState<Event | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    setTab('overview');
    (async () => {
      const [p, m, inv] = await Promise.all([
        getProject(projectId),
        getProjectMaterials(projectId).catch(() => []),
        getInvoicesByProject(projectId).catch(() => []),
      ]);
      setProject(p);
      setMaterials(m);
      setInvoices(inv);
      setLoading(false);
    })();
  }, [open, projectId]);

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm(`Delete project "${project.title}"? This cannot be undone.`)) return;
    try {
      await deleteProject(project.id);
      toast.success('Project deleted');
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const region: Region = project?.region === 'SAUDI' ? 'SAUDI' : 'UAE';
  const currency = regionCurrency(region);
  const meta = project ? projectStatus(project.status) : null;
  const materialsTotal = materials.reduce(
    (s, m) => s + (m.total_cost ?? (m.quantity || 0) * (m.unit_cost ?? m.unit_price ?? 0)),
    0
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'materials', label: 'Materials', count: materials.length },
    { id: 'invoices', label: 'Invoices', count: invoices.length },
  ];

  return (
    <Drawer open={open} onClose={onClose} width={480}>
      {loading || !project ? (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-6 pr-12">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {REGION_FLAG[region]}
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

          <div className="flex border-b border-border px-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors ${
                  tab === t.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {t.count ? (
                  <span className="rounded-full bg-surface-2 px-1.5 text-[11px]">{t.count}</span>
                ) : null}
                {tab === t.id && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'overview' && (
              <dl className="space-y-5">
                <Row icon={CalendarRange} label="Dates">
                  {formatDate(project.event_date)}
                  {project.end_date && ` → ${formatDate(project.end_date)}`}
                </Row>
                {project.venue_name && (
                  <Row icon={Building2} label="Venue">{project.venue_name}</Row>
                )}
                {project.location && (
                  <Row icon={MapPin} label="Location">{project.location}</Row>
                )}
                {project.type && <Row icon={Package} label="Type">{project.type}</Row>}
                {project.expected_guests != null && (
                  <Row icon={Users} label="Expected guests">{project.expected_guests}</Row>
                )}
                {project.budget_total != null && (
                  <Row icon={Wallet} label="Budget">
                    <span className="tnum">{formatCurrency(project.budget_total, currency)}</span>
                  </Row>
                )}
                {project.manager?.full_name && (
                  <Row icon={Users} label="Manager">{project.manager.full_name}</Row>
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

            {tab === 'materials' && (
              <div>
                {materials.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No materials recorded for this project.
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
                            <td className="py-2 text-foreground">{m.material_name}</td>
                            <td className="py-2 text-right tnum text-muted-foreground">
                              {m.quantity} {m.unit}
                            </td>
                            <td className="py-2 text-right tnum text-foreground">
                              {formatCurrency(
                                m.total_cost ?? (m.quantity || 0) * (m.unit_cost ?? 0),
                                currency
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
                      <span>Total</span>
                      <span className="tnum">{formatCurrency(materialsTotal, currency)}</span>
                    </div>
                  </>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Manage materials from the Materials page.
                </p>
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
                      to="/invoices"
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-surface-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {inv.invoice_number ?? inv.doc_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(inv.total_amount ?? 0, currency)}
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
