import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Event, Profile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { CreateEventModal } from './CreateEventModal';

interface CalendarViewProps {
  onEventClick: (eventId: string) => void;
}

export function CalendarView({ onEventClick }: CalendarViewProps) {
  const { profile } = useAuth();
  const [events, setEvents] = useState<(Event & { manager?: Profile })[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'list'>('month');

  useEffect(() => {
    fetchEvents();
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['manager', 'senior_manager', 'admin'])
      .order('full_name');

    if (data) setManagers(data);
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        manager:profiles!events_manager_id_fkey(*)
      `)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.event_date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const canCreateEvent = profile?.role === 'admin' || profile?.role === 'senior_manager';

  const statusColors = {
    planned: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView(view === 'month' ? 'list' : 'month')}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {view === 'month' ? 'List View' : 'Calendar View'}
            </button>
            {canCreateEvent && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>New Event</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {view === 'month' ? (
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="h-28 bg-slate-50 rounded-lg" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const dayEvents = getEventsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={day}
                  className={`h-28 border rounded-lg p-2 hover:border-slate-400 transition-colors ${
                    isToday ? 'border-slate-800 bg-slate-50' : 'border-slate-200'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-slate-900' : 'text-slate-600'}`}>
                    {day}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-16">
                    {dayEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event.id)}
                        className={`w-full text-left text-xs px-2 py-1 rounded border ${statusColors[event.status]} hover:opacity-80 transition-opacity truncate`}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No events scheduled
              </div>
            ) : (
              events.map(event => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event.id)}
                  className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-slate-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{event.title}</h3>
                      <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        <span>{event.location}</span>
                        {event.manager && <span>Manager: {event.manager.full_name}</span>}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal
          managers={managers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
