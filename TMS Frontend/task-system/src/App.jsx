import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Scene from "./components/layout/Scene";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/useAuthStore";
import { usePermissionStore } from "./store/usePermissionStore";
//import ConfettiOverlay from "./Features/tasks/components/ConfettiOverlay";
import { connectSocket, getSocket } from "./lib/socket";
import { useChatStore } from "./Features/chat/chatStore";
import { useActivityStore } from "./Features/activities/activityStore";
import {
  requestNotificationPermission,
  initBadgeClearOnFocus,
} from "./lib/notify";
import TaskCompleteLottie from "./Features/tasks/components/TaskCompleteLottie";

export default function App() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const isAdmin = user?.role === "admin";

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
    requestNotificationPermission();
  }, [user]);

  useEffect(() => {
    if (!user) {
      usePermissionStore.getState().reset();
      return;
    }
    if (!getSocket()) connectSocket();
    useChatStore.getState().initSocketListeners();
    useActivityStore.getState().initSocketListeners();
    requestNotificationPermission();
    usePermissionStore.getState().loadPermissions();
  }, [user]);

  // App-wide, independent of login state: clears the tab title/favicon
  // bubble as soon as the user actually looks back at this tab.
  useEffect(() => initBadgeClearOnFocus(), []);

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
      <TaskCompleteLottie />
      {/*
        DREAMS logo — fits into the corner freed up by the removed
        navbar. "absolute" (not "fixed"), so it scrolls away with the
        page instead of staying stuck on screen. Sits just above the
        sidebar, which now starts at top-16 instead of top-20.
      */}
      <img
        src="/dreamsLogo.png"
        alt="DREAMS"
        className="absolute left-5 top-4 h-9 w-auto z-20"
      />
      <Sidebar
        isAdmin={isAdmin}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((prev) => !prev)}
      />
      <Header />
      <main
        // pt-6 -> pt-24: page content (e.g. the "Tasks" heading and its
        // toolbar) was sitting at the same height as the header's
        // bell/profile icons and colliding with them. This pushes
        // content below the header row instead.
        className={`relative z-10 pt-15 pr-6 pb-6 min-h-screen transition-[padding-left] duration-500 ease-out ${
          sidebarExpanded ? "pl-[284px]" : "pl-28"
        }`}
      >
        <AppRoutes />
      </main>
    </div>
  );
}
