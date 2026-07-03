import { useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return <AppRoutes />;
  }

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar isAdmin={user?.role === "admin"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user?.name || "Guest"} />
        <main className="flex-1 overflow-y-auto p-6">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}
