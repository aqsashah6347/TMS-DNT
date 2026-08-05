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
import { teamApi } from "./api/teamApi";

export default function App() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const isAdmin = user?.role === "admin";

  // Performance page + nav link are visible to admins, and to anyone who's
  // been made a team's manager (which doesn't require the "manager" role —
  // any user can be set as a team's manager_id from the Teams page). This
  // is a lightweight, separate check from the Performance page's own data
  // fetch, since the sidebar needs the answer on every page, not just
  // while actually on /performance.
  const [managesAnyTeam, setManagesAnyTeam] = useState(false);
  useEffect(() => {
    if (!user || isAdmin) return;
    let cancelled = false;
    teamApi
      .getManagedTeams()
      .then((teams) => {
        if (!cancelled) setManagesAnyTeam((teams || []).length > 0);
      })
      .catch(() => {
        if (!cancelled) setManagesAnyTeam(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

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
      <Sidebar
        isAdmin={isAdmin}
        showPerformance={isAdmin || managesAnyTeam}
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
