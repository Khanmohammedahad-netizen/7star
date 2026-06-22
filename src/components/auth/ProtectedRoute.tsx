import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/roles';
import { Spinner } from '../ui/Spinner';

interface Props {
  children: JSX.Element;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && role && !roles.includes(role)) {
    return (
      <div className="mx-auto mt-24 max-w-md text-center">
        <h2 className="text-lg font-semibold text-foreground">Access restricted</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return children;
}

export { ProtectedRoute };
