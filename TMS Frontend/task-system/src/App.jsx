import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Scene from "./components/layout/Scene";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/useAuthStore";
import ConfettiOverlay from "./Features/tasks/components/ConfettiOverlay";

export default function App() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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
      <ConfettiOverlay />
      <Sidebar
        isAdmin={user?.role === "admin"}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((prev) => !prev)}
      />
      <Header />
      <main
        className={`relative z-10 pt-20 pr-6 pb-6 min-h-screen transition-[padding-left] duration-500 ease-out ${
          sidebarExpanded ? "pl-[284px]" : "pl-28"
        }`}
      >
        <AppRoutes />
      </main>
    </div>
  );
}
