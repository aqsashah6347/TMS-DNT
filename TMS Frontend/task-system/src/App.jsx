import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Scene from "./components/layout/Scene";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/useAuthStore";
import ConfettiOverlay from "./Features/tasks/components/ConfettiOverlay";
import { connectSocket, getSocket } from "./lib/socket";
import { useChatStore } from "./Features/chat/chatStore";
import { useActivityStore } from "./Features/activities/activityStore";

export default function App() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Connects once as soon as we know who's logged in — covers both a
  // fresh login (useAuthStore.login already connects) and a page
  // refresh where the session is restored from sessionStorage, since
  // that path never calls login(). Keeps the socket alive app-wide so
  // messages/notifications push in no matter what page you're on.
  useEffect(() => {
    if (!user) return;
    if (!getSocket()) connectSocket();
    useChatStore.getState().initSocketListeners();
    useActivityStore.getState().initSocketListeners();
  }, [user]);

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