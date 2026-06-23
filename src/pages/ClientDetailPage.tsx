import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Mail, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { CountryFlag } from '../components/shared/CountryFlag';
import { CallWhatsappButtons } from '../components/shared/CallWhatsappButtons';
import { ClientForm } from '../components/clients/ClientForm';
import { getClient, deleteClient } from '../lib/api/clients';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isAdminRole } from '../types/roles';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';
import type { Client, Event } from '../types/database';
import { useNavigate } from 'react-router-dom';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const c = await getClient(id);
    setClient(c);
    const { data } = await supabase
      .from('events')
      .select('id, title, event_date, status')
      .eq('client_id', id)
      .order('event_date', { ascending: false });
    setProjects((data as Event[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!client) return;
    if (!confirm(`Delete ${client.name}?`)) return;
    try {
      await deleteClient(client.id);
      toast.success('Client deleted');
      navigate('/clients');
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

  if (!client) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Link to="/clients" className="mt-2 inline-block text-primary">
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/clients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Clients
      </Link>

      <PageHeader
        title={client.name}
        actions={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            {isAdminRole(role) && (
              <Button variant="ghost" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <CountryFlag region={client.region} showLabel />
            </div>
            <dl className="space-y-3 text-sm">
              {client.company_name && (
                <div className="flex items-center gap-2 text-foreground">
                  {client.company_name}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${client.email}`} className="hover:text-primary">
                    {client.email}
                  </a>
                </div>
              )}
              {client.representative_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {client.representative_phone}
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4" /> {client.address}
                </div>
              )}
            </dl>
            {client.notes && (
              <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm text-muted-foreground">
                {client.notes}
              </p>
            )}
          </Card>

          <Card padding="none">
            <h3 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
              Representative
            </h3>
            {client.representative_name ? (
              <div className="flex items-center gap-3 px-5 py-3">
                <Avatar name={client.representative_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {client.representative_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.representative_phone || 'Representative'}
                  </p>
                </div>
                <CallWhatsappButtons phone={client.representative_phone} />
              </div>
            ) : (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                No representative on file.
              </p>
            )}
          </Card>
        </div>

        <Card padding="none" className="lg:col-span-2">
          <h3 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
            Projects ({projects.length})
          </h3>
          {projects.length > 0 ? (
            <ul className="divide-y divide-border">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.event_date)}
                    </p>
                  </div>
                  <Badge variant="neutral">{p.status.replace('_', ' ')}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              No projects for this client yet.
            </p>
          )}
        </Card>
      </div>

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        client={client}
      />
    </div>
  );
}
