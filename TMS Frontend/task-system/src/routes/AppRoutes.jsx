import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Lazy-loaded pages — each one is a separate chunk, only fetched when visited
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Tasks = lazy(() => import("../pages/Tasks"));
const Projects = lazy(() => import("../pages/Projects"));
const Teams = lazy(() => import("../pages/Teams"));
const Inbox = lazy(() => import("../pages/Inbox"));
const Analytics = lazy(() => import("../pages/Analytics"));
const Admin = lazy(() => import("../pages/Admin"));
const Access = lazy(() => import("../pages/Access"));
const Settings = lazy(() => import("../pages/Settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full text-muted text-sm">
      Loading...
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/access" element={<Access />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
