import { useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import BackgroundOrbs from "./components/layout/BackgroundOrbs";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return (
      <>
        <BackgroundOrbs />
        <AppRoutes />
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <BackgroundOrbs />
      <Sidebar isAdmin={user?.role === "admin"} />
      <Header />

      <main className="relative z-10 pt-24 pl-28 pr-6 pb-6 min-h-screen">
        <AppRoutes />
      </main>
    </div>
  );
}