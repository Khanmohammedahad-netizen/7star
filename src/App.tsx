import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PinGate } from './components/admin/PinGate';
import { Spinner } from './components/ui/Spinner';
import LoginPage from './pages/auth/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('./pages/EmployeeDetailPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const QuotationsPage = lazy(() => import('./pages/QuotationsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AccountsPage = lazy(() => import('./pages/admin/AccountsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const DIRECTORY_ROLES = [
  'super_admin',
  'admin',
  'senior_manager',
  'manager',
] as const;

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/materials" element={<MaterialsPage />} />

          <Route
            path="/clients"
            element={
              <ProtectedRoute roles={[...DIRECTORY_ROLES]}>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute roles={[...DIRECTORY_ROLES]}>
                <ClientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute roles={[...DIRECTORY_ROLES]}>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute roles={[...DIRECTORY_ROLES]}>
                <EmployeeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute roles={[...DIRECTORY_ROLES]}>
                <QuotationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute roles={[...DIRECTORY_ROLES]}>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <PinGate />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountsPage />} />
          </Route>
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
