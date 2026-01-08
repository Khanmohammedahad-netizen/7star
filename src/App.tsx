<<<<<<< HEAD
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
=======
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import { DashboardPage } from './pages/DashboardPage';
import { EventsCalendarPage } from './pages/EventsCalendarPage';
import { AccountsPage } from './pages/AccountsPage';
import { ShajiPersonalAccountsPage } from './pages/ShajiPersonalAccountsPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { UsersPage } from './pages/UsersPage';
import { EventDetailPage } from './pages/EventDetailPage';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
>>>>>>> 73d15c7 (Fix layout, routing, sidebar, and frontend startup issues)

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

<<<<<<< HEAD
  if (!user || !profile) {
    return <Login />;
  }

  return <Dashboard />;
}

export default App;
=======
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<EventsCalendarPage />} />
        <Route path="/accounts" element={<ProtectedRoute roles={['admin', 'accountant']}><AccountsPage /></ProtectedRoute>} />
        <Route path="/shaji-accounts" element={<ProtectedRoute roles={['admin']}><ShajiPersonalAccountsPage /></ProtectedRoute>} />
        <Route path="/quotations" element={<ProtectedRoute roles={['admin', 'accountant']}><QuotationsPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute roles={['admin', 'accountant']}><InvoicesPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute roles={['admin', 'accountant']}><PaymentsPage /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute roles={['admin', 'manager', 'senior_manager']}><ClientsPage /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute roles={['admin', 'manager', 'senior_manager']}><ClientDetailPage /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute roles={['admin', 'manager', 'senior_manager']}><EmployeesPage /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute roles={['admin', 'manager', 'senior_manager']}><EmployeeDetailPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Route>
    </Routes>
  );
}

function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

export default AppWrapper;
>>>>>>> 73d15c7 (Fix layout, routing, sidebar, and frontend startup issues)
