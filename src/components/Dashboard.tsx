import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { CalendarView } from './CalendarView';
import { EventDetails } from './EventDetails';
import { MaterialsManagement } from './MaterialsManagement';
import { PaymentsManagement } from './PaymentsManagement';
import { InvoicesManagement } from './InvoicesManagement';
import { UsersManagement } from './UsersManagement';

type View = 'calendar' | 'materials' | 'payments' | 'invoices' | 'users';

export function Dashboard() {
  const { profile } = useAuth();

  const [currentView, setCurrentView] = useState<View>('calendar');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!profile) {
    return null;
  }

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('calendar');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 h-full w-64 bg-white border-r
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0
        `}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setSidebarOpen(false); // close on mobile click
          }}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {currentView === 'calendar' && 'Events Calendar'}
                {currentView === 'materials' && 'Materials Management'}
                {currentView === 'payments' && 'Payment Tracking'}
                {currentView === 'invoices' && 'Invoice Management'}
                {currentView === 'users' && 'User Management'}
              </h1>

              <div className="flex items-center space-x-4 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                  {profile.region.toUpperCase()}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  {profile.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* ☰ Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden rounded p-2 hover:bg-slate-200 text-xl"
            >
              ☰
            </button>
          </div>

          {/* Views */}
          {currentView === 'calendar' && (
            selectedEventId ? (
              <EventDetails
                eventId={selectedEventId}
                onBack={() => setSelectedEventId(null)}
              />
            ) : (
              <CalendarView onEventClick={handleEventClick} />
            )
          )}

          {currentView === 'materials' && <MaterialsManagement />}
          {currentView === 'payments' && <PaymentsManagement />}
          {currentView === 'invoices' && <InvoicesManagement />}
          {currentView === 'users' && profile.role === 'admin' && (
            <UsersManagement />
          )}
        </div>
      </main>
    </div>
  );
}
