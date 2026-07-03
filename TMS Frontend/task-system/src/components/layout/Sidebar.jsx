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
    `group relative flex items-center gap-3 px-4 py-2.5 rounded-card text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-white/10 text-white shadow-sm backdrop-blur-md"
        : "text-white/60 hover:bg-white/5 hover:text-white"
    }`;

  return (
    /* Uses bg-sidebar now so it is completely independent of other elements */
    <aside className="w-64 h-screen bg-sidebar flex flex-col py-6 px-3 shadow-xl">
      <div className="px-4 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shadow-sm">
          <span className="text-dark font-bold text-sm">T</span>
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">TMS</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary-light" />
                )}
                <Icon size={18} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-white/10" />
            <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">
              Administration
            </p>
            {adminItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary-light" />
                    )}
                    <Icon size={18} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 pt-3">
        <NavLink to="/settings" className={linkClass}>
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
