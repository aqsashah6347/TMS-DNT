import { useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Scene from "./components/layout/Scene";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return (
      <>
        <Scene />
        <AppRoutes />
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Scene />
      <Sidebar isAdmin={user?.role === "admin"} />
      <Header />
      <main className="relative z-10 pt-20 pl-28 pr-6 pb-6 min-h-screen">
        <AppRoutes />
      </main>
    </div>
  );
}
