import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface CalendarEvent {
  id: string;
  name: string;
  client: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

interface CalendarPageProps {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
  onReschedule?: (eventId: string, newDate: string) => void;
}

export default function CalendarPage({
  events,
  onEventClick,
  onReschedule
}: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  const badgeVariant = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const eventsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* GRID */}
      <Card>
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="bg-gray-50 p-3 text-xs font-semibold">
              {d}
            </div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={i} className="bg-white p-3" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(year, month, day).toISOString().split('T')[0];

            return (
              <div
                key={day}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedEventId && onReschedule) {
                    onReschedule(draggedEventId, dateStr);
                    setDraggedEventId(null);
                  }
                }}
                className="bg-white p-2 min-h-[90px]"
              >
                <div className="text-xs font-semibold mb-1">{day}</div>

                {eventsForDay(day).map(ev => (
                  <div key={ev.id} className="relative group">
                    <Badge
                      draggable
                      onDragStart={() => setDraggedEventId(ev.id)}
                      onClick={() => onEventClick?.(ev.id)}
                      variant={badgeVariant(ev.status)}
                      className="w-full truncate cursor-move"
                    >
                      {ev.name}
                    </Badge>

                    {/* TOOLTIP */}
                    <div className="absolute hidden group-hover:block z-20 mt-2 w-56 rounded-lg bg-white border shadow p-3 text-xs">
                      <div className="font-semibold">{ev.name}</div>
                      <div>Client: {ev.client}</div>
                      <div>Date: {new Date(ev.date).toDateString()}</div>
                      <Badge variant={badgeVariant(ev.status)} className="mt-1">
                        {ev.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
