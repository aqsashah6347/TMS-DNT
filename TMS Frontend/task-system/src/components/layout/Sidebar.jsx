import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users, Inbox,
  BarChart3, ShieldCheck, KeyRound, Settings, ChevronRight,
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
  const [expanded, setExpanded] = useState(true);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? "bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(22,163,74,0.25),0_0_16px_-2px_rgba(22,163,74,0.35)]"
        : "text-dark/60 hover:bg-white/40 hover:text-dark"
    }`;

  return (
    <aside
      className={`glass-nav fixed left-5 top-1/2 -translate-y-1/2 z-20 flex flex-col rounded-[32px] py-5 transition-all duration-500 ease-out ${
        expanded ? "w-60 px-4" : "w-[68px] px-2 items-center"
      }`}
    >
      <div className="glass-content flex flex-col h-full w-full">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/50 transition-all mb-4 ${
            expanded ? "self-end" : "self-center"
          }`}
        >
          <ChevronRight size={16} className={`text-dark/60 transition-transform duration-500 ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="px-1 mb-4">
            <p className="text-xs font-semibold text-dark/40 tracking-wide">TMS</p>
          </div>
        )}

        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} title={!expanded ? label : undefined}>
              <Icon size={18} className="shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-dark/10" />
              {adminItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass} title={!expanded ? label : undefined}>
                  <Icon size={18} className="shrink-0" />
                  {expanded && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto pt-3 border-t border-dark/10">
          <NavLink to="/settings" className={linkClass} title={!expanded ? "Settings" : undefined}>
            <Settings size={18} className="shrink-0" />
            {expanded && <span>Settings</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}