import { useEffect, useMemo, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { ProjectDrawer } from '../components/projects/ProjectDrawer';
import { ProjectForm } from '../components/projects/ProjectForm';
import { getProjects } from '../lib/api/projects';
import { PROJECT_STATUS } from '../lib/status';
import { COUNTRY_FLAG } from '../lib/constants';
import { toast } from 'sonner';
import type { Event } from '../types/database';

export default function CalendarPage() {
  const [projects, setProjects] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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

  const events: EventInput[] = useMemo(
    () =>
      projects.map((p) => {
        const meta = PROJECT_STATUS[p.status];
        const country = p.country ?? (p.region === 'saudi' ? 'SA' : 'UAE');
        return {
          id: p.id,
          title: `${COUNTRY_FLAG[country]} ${p.title}${
            p.client?.name ? ` · ${p.client.name}` : ''
          }`,
          start: p.event_date,
          end: p.end_date ?? undefined,
          allDay: true,
          backgroundColor: meta.color,
          borderColor: meta.color,
          textColor: '#ffffff',
          classNames: meta.strike ? ['line-through'] : [],
        };
      }),
    [projects]
  );

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedId(arg.event.id);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (project: Event) => {
    setEditing(project);
    setDrawerOpen(false);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="All projects and events across UAE & Saudi operations."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <Card padding="md" className="fc-theme">
        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin,
            ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listMonth',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            firstDay={1}
            eventDisplay="block"
          />
        )}
      </Card>

      <ProjectDrawer
        projectId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={openEdit}
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
