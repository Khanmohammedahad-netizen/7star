import { useEffect, useState } from 'react';
import { Search, Calendar as CalendarIcon, Eye } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import CalendarPage from './calendar/CalendarPage';
import CreateEventModal from '../components/events/CreateEventModal';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Event {
  id: string;
  name: string; // UI name (maps to DB title)
  client: string;
  date: string; // UI date (maps to DB event_date)
  status: 'Approved' | 'Pending' | 'Rejected';
}

export function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ───────────── FETCH EVENTS ───────────── */
  const fetchEvents = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, client, event_date, status')
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error.message);
        return;
      }

      const mapped: Event[] = (data || []).map((event: any) => ({
        id: event.id,
        name: event.title,        // ✅ DB → UI
        client: event.client,
        date: event.event_date,   // ✅ DB → UI
        status: event.status
      }));

      setEvents(mapped);
    } catch (err) {
      console.error('Unexpected error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        fetchEvents
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ───────────── DRAG RESCHEDULE ───────────── */
  const rescheduleEvent = async (id: string, newDate: string) => {
    await supabase
      .from('events')
      .update({ event_date: newDate })
      .eq('id', id);

    fetchEvents();
  };

  const filtered = events.filter(e =>
    `${e.name} ${e.client}`.toLowerCase().includes(search.toLowerCase())
  );

  const badgeVariant = (status: Event['status']) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      default:
        return 'error';
    }
  };

  return (
    <div className="space-y-6">

      {/* CALENDAR */}
      <CalendarPage
        events={events}
        onEventClick={(id) => navigate(`/events/${id}`)}
        onReschedule={rescheduleEvent}
      />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Events</h2>
          <p className="text-sm text-gray-600">
            All scheduled and upcoming events
          </p>
        </div>

        <Button onClick={() => setOpenCreate(true)}>
          <CalendarIcon size={18} className="mr-2" />
          Create Event
        </Button>
      </div>

      {/* TABLE */}
      <Card>
        <div className="mb-6 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading events…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Event</th>
                <th className="text-left py-3">Client</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Status</th>
                <th className="text-right py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{e.name}</td>
                  <td className="py-3 text-gray-600">{e.client}</td>
                  <td className="py-3">
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <Badge variant={badgeVariant(e.status)}>
                      {e.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/events/${e.id}`)}
                    >
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* CREATE EVENT MODAL */}
      {openCreate && (
        <CreateEventModal
          onClose={() => setOpenCreate(false)}
          onCreate={async (event) => {
            if (!user) {
              alert('You must be logged in to create events');
              return;
            }

            const { error } = await supabase.from('events').insert({
              title: event.name,          // ✅ UI → DB
              client: event.client,
              event_date: event.date,
              status: event.status,
              region: user.region,
              created_by: user.id
            });

            if (error) {
              alert(`Failed to create event: ${error.message}`);
              return;
            }

            setOpenCreate(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
