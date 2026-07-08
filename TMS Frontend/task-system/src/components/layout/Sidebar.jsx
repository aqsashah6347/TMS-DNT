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
   `flex items-center gap-3 group rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
     isActive
       ? "bg-orange-500/15 text-orange-400 shadow-[0_0_0_1px_rgba(249,115,22,0.35),0_0_20px_-4px_rgba(249,115,22,0.45)]"
       : "text-white/60 hover:bg-white/10 hover:text-white hover:shadow-[0_0_12px_rgba(249,115,22,0.15)]"
   }`;

  return (
    <aside
      className={`hash-nav fixed left-5 top-20 bottom-5 z-20 overflow-visible flex flex-col transition-all duration-500 ease-out ${
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

        {expanded && <div className="px-1 mb-4"></div>}

        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <div key={to} className="relative group w-full">
              <NavLink to={to} className={linkClass}>
                <Icon
                  size={18}
                  className="shrink-0 transition-all duration-200 group-hover:scale-110"
                />
                {expanded && <span className="truncate">{label}</span>}
              </NavLink>

              {!expanded && (
                <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-900 border border-orange-400/30 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none z-50">
                  {label}
                </div>
              )}
            </div>
          ))}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-white/10" />
              {adminItems.map(({ to, label, icon: Icon }) => (
                <div key={to} className="relative group w-full">
                  <NavLink to={to} className={linkClass}>
                    <Icon size={18} className="shrink-0" />
                    {expanded && <span className="truncate">{label}</span>}
                  </NavLink>

                  {!expanded && (
                    <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-900 border border-orange-400/30 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none z-50">
                      {label}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="relative group w-full">
            <NavLink to="/settings" className={linkClass}>
              <Settings size={18} className="shrink-0" />
              {expanded && <span>Settings</span>}
            </NavLink>

            {!expanded && (
              <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-900 border border-orange-400/30 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none z-50">
                Settings
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
