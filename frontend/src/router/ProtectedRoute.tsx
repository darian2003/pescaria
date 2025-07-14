import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || !allowedRoles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
