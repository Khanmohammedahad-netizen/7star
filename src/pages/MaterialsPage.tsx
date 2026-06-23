import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Search, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CountryFlag } from '../components/shared/CountryFlag';
import { MaterialForm } from '../components/materials/MaterialForm';
import { getMaterials, deleteMaterial } from '../lib/api/materials';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { toast } from 'sonner';
import type { Material } from '../types/database';

export default function MaterialsPage() {
  const { role } = useAuth();
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getMaterials());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (item: Material) => {
    if (!confirm(`Delete ${item.material_name}?`)) return;
    try {
      await deleteMaterial(item.id);
      toast.success('Material deleted');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = items.filter((i) =>
    i.material_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Materials used across projects."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New material
          </Button>
        }
      />

      <div className="mb-4 relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search materials…"
          className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={query ? 'No matching materials' : 'No materials yet'}
          description={query ? 'Try another search.' : 'Add your first material.'}
          action={
            !query && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> New material
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
                    <th className="px-5 py-3 font-medium">Material</th>
                    <th className="px-5 py-3 font-medium">Unit</th>
                    <th className="px-5 py-3 text-right font-medium">Qty</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Region</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      className="group border-b border-border last:border-0 hover:bg-surface-2"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {m.material_name}
                        {m.supplier && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {m.supplier}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{m.unit || '—'}</td>
                      <td className="px-5 py-3 text-right tnum text-muted-foreground">
                        {m.quantity}
                      </td>
                      <td className="px-5 py-3 text-right tnum text-foreground">
                        {formatCurrency(
                          m.total_cost ?? (m.quantity || 0) * (m.unit_cost ?? 0)
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {m.region ? <CountryFlag region={m.region} /> : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditing(m);
                              setFormOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-primary cursor-pointer"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {isAdminRole(role) && (
                            <button
                              onClick={() => remove(m)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-destructive cursor-pointer"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((m) => (
              <Card key={m.id} padding="md" className="border border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Material</p>
                      <div>
                        <p className="font-semibold text-foreground truncate">
                          {m.material_name}
                        </p>
                        {m.supplier && (
                          <p className="text-xs text-muted-foreground truncate">
                            {m.supplier}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {m.region ? <CountryFlag region={m.region} /> : '—'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Unit</p>
                      <p className="font-medium truncate">{m.unit || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Qty</p>
                      <p className="font-medium tnum">{m.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="font-semibold tnum text-foreground">
                        {formatCurrency(
                          m.total_cost ?? (m.quantity || 0) * (m.unit_cost ?? 0)
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setFormOpen(true);
                      }}
                      className="flex-1 flex items-center gap-2 rounded-lg border border-input bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2 hover:text-primary transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">Edit</span>
                    </button>
                    {isAdminRole(role) && (
                      <button
                        onClick={() => remove(m)}
                        className="flex-1 flex items-center gap-2 rounded-lg border border-destructive bg-surface px-3 py-1.5 text-xs font-medium text-destructive hover:bg-surface-2 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <MaterialForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        item={editing}
      />
    </div>
  );
}
