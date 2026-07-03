import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Inbox,
  BarChart3,
  ShieldCheck,
  KeyRound,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const adminItems = [
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/access", label: "Manage Access", icon: KeyRound },
];

export default function Sidebar({ isAdmin = false }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-card text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary text-dark"
        : "text-muted hover:bg-primary-light hover:text-dark"
    }`;

  return (
    <aside className="w-64 h-screen bg-surface border-r border-primary-light flex flex-col py-6 px-3">
      <div className="px-4 mb-8">
        <h1 className="text-lg font-bold text-dark">TMS</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-primary-light" />
            {adminItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <NavLink to="/settings" className={linkClass}>
        <Settings size={18} />
        Settings
      </NavLink>
    </aside>
  );
}
