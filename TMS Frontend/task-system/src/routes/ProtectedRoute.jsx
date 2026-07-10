import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

// Wrap any route element with this. adminOnly=true also blocks non-admin users.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
