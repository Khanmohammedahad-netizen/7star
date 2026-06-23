import { useEffect, useState, useCallback } from 'react';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ProjectDrawer } from '../components/projects/ProjectDrawer';
import { ProjectForm } from '../components/projects/ProjectForm';
import { getProjects } from '../lib/api/projects';
import { projectStatus } from '../lib/status';
import { REGION_FLAG, regionCurrency } from '../lib/constants';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Region } from '../types/database';
import { toast } from 'sonner';
import type { Event } from '../types/database';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await getProjects());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every event across the business."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="mb-4 relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={query ? 'No matching projects' : 'No projects yet'}
          description={
            query
              ? 'Try a different search term.'
              : 'Create your first project to see it on the calendar.'
          }
          action={
            !query && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> New project
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <Card padding="none" className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Dates</th>
                    <th className="px-5 py-3 font-medium">Budget</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const region: Region = p.region === 'SAUDI' ? 'SAUDI' : 'UAE';
                    const meta = projectStatus(p.status);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelectedId(p.id);
                          setDrawerOpen(true);
                        }}
                        className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2"
                      >
                        <td className="px-5 py-3.5">
                          <span className="mr-2" aria-hidden>
                            {REGION_FLAG[region]}
                          </span>
                          <span className="font-medium text-foreground">
                            {p.title}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {p.client?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {formatDate(p.event_date)}
                        </td>
                        <td className="px-5 py-3.5 tnum text-muted-foreground">
                          {p.budget_total != null
                            ? formatCurrency(p.budget_total, regionCurrency(region))
                            : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={meta.badge} dot>
                            {meta.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((p) => {
              const region: Region = p.region === 'SAUDI' ? 'SAUDI' : 'UAE';
              const meta = projectStatus(p.status);
              return (
                <Card
                  key={p.id}
                  padding="md"
                  hover
                  className="cursor-pointer border border-border"
                  onClick={() => {
                    setSelectedId(p.id);
                    setDrawerOpen(true);
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Project</p>
                        <div className="flex items-start gap-2">
                          <span className="mr-1 text-lg" aria-hidden>
                            {REGION_FLAG[region]}
                          </span>
                          <p className="font-semibold text-foreground truncate">
                            {p.title}
                          </p>
                        </div>
                      </div>
                      <Badge variant={meta.badge} dot>
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Client</p>
                        <p className="font-medium truncate">
                          {p.client?.name ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <p className="font-medium">
                          {formatDate(p.event_date)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Budget</p>
                      <p className="font-semibold tnum">
                        {p.budget_total != null
                          ? formatCurrency(p.budget_total, regionCurrency(region))
                          : '—'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <ProjectDrawer
        projectId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={(project) => {
          setEditing(project);
          setDrawerOpen(false);
          setFormOpen(true);
        }}
        onChanged={load}
      />
      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        project={editing}
      />
    </div>
  );
}
