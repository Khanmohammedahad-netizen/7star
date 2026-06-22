import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import ProjectsPage from './pages/ProjectsPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import UsersPage from './pages/UsersPage';
import MaterialsPage from './pages/MaterialsPage';
import QuotationsPage from './pages/QuotationsPage';
import InvoicesPage from './pages/InvoicesPage';
import NotificationsPage from './pages/NotificationsPage';
import { AccountsPage, SettingsPage } from './pages/placeholders';

const DIRECTORY_ROLES = [
  'super_admin',
  'admin',
  'senior_manager',
  'manager',
] as const;

export default function App() {
  return (
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
              <AccountsPage />
            </ProtectedRoute>
          }
        />
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
  );
}
