import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users2, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CountryFlag } from '../components/shared/CountryFlag';
import { ClientForm } from '../components/clients/ClientForm';
import { getClients } from '../lib/api/clients';
import { toast } from 'sonner';
import type { Client } from '../types/database';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClients(await getClients());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Companies and their representatives."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New client
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients…"
          className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users2}
          title={query ? 'No matching clients' : 'No clients yet'}
          description={
            query ? 'Try another search.' : 'Add your first client to begin.'
          }
          action={
            !query && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> New client
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              hover
              className="cursor-pointer"
              padding="md"
            >
              <button
                className="w-full text-left"
                onClick={() => navigate(`/clients/${c.id}`)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  <CountryFlag region={c.region} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {c.company_name || c.email || 'No contact info'}
                </p>
                <p className="mt-3 truncate text-xs text-muted-foreground">
                  {c.representative_name || 'No representative'}
                </p>
              </button>
            </Card>
          ))}
        </div>
      )}

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
