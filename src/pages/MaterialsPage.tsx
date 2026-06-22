import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Search, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CountryFlag } from '../components/shared/CountryFlag';
import { MaterialForm } from '../components/materials/MaterialForm';
import { getCatalog, deleteCatalogItem } from '../lib/api/materials';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { toast } from 'sonner';
import type { MaterialCatalogItem } from '../types/database';

export default function MaterialsPage() {
  const { role } = useAuth();
  const [items, setItems] = useState<MaterialCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialCatalogItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getCatalog());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (item: MaterialCatalogItem) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await deleteCatalogItem(item.id);
      toast.success('Material deleted');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.sku?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Inventory catalogue used across projects."
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

      <div className="mb-4 relative max-w-sm">
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
          description={query ? 'Try another search.' : 'Build your catalogue.'}
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
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 text-right font-medium">Unit cost</th>
                  <th className="px-5 py-3 text-right font-medium">Stock</th>
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
                      {m.name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {m.sku || '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{m.unit}</td>
                    <td className="px-5 py-3 text-right tnum text-foreground">
                      {formatCurrency(m.unit_cost)}
                    </td>
                    <td className="px-5 py-3 text-right tnum text-muted-foreground">
                      {m.stock_qty}
                    </td>
                    <td className="px-5 py-3">
                      {m.country ? <CountryFlag country={m.country} /> : '—'}
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
