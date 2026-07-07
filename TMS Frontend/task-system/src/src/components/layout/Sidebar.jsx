import { useState } from "react";
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
  ChevronRight,
} from "lucide-react";
import Logo from "./Logo";

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
  const [expanded, setExpanded] = useState(false);

 const linkClass = ({ isActive }) =>
   `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
     isActive
       ? "bg-orange-500/15 text-orange-400 shadow-[0_0_0_1px_rgba(249,115,22,0.35),0_0_20px_-4px_rgba(249,115,22,0.45)]"
       : "text-white/60 hover:bg-white/10 hover:text-white hover:shadow-[0_0_12px_rgba(249,115,22,0.15)]"
   }`;

  return (
    <aside
      className={`hash-nav fixed left-5 top-20 bottom-5 z-20 flex flex-col transition-all duration-500 ease-out ${
        expanded ? "w-60 px-4" : "w-[68px] px-2 items-center"
      }`}
    >
      <div className="glass-content flex flex-col h-full w-full">
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
          {expanded && (
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-sm font-semibold text-white tracking-wide">
                TMS
              </span>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center justify-center w-7 h-7 text-white/40 hover:text-white transition-colors ${!expanded ? "mx-auto" : ""}`}
          >
            <ChevronRight
              size={16}
              className={`transition-transform duration-500 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {expanded && (
          <div className="px-1 mb-4">
            
          </div>
        )}

        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClass}
              title={!expanded ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-white/10" />
              {adminItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={linkClass}
                  title={!expanded ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {expanded && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto pt-3 border-t border-white/10">
          <NavLink
            to="/settings"
            className={linkClass}
            title={!expanded ? "Settings" : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {expanded && <span>Settings</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
