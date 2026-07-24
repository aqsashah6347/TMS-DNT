import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Bell, // was: Inbox
  MessageCircle,
  BarChart3,
  KeyRound,
  IdCard,
  Settings,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Logo from "./Logo";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/activity", label: "Activity Log", icon: Bell }, // was: { to: "/inbox", label: "Inbox", icon: Inbox }
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const adminItems = [
  { to: "/performance", label: "Performance", icon: TrendingUp },
  { to: "/access", label: "Manage Access", icon: KeyRound },
  { to: "/employees", label: "Employees", icon: IdCard },
];

export default function Sidebar({ isAdmin = false, expanded, onToggle }) {
  const linkClass = ({ isActive }) =>
    `relative flex items-center gap-3 group rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-[#fb923c]/10 text-[#ffd7ae]"
        : "text-white/55 hover:bg-white/5 hover:text-white"
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
            onClick={onToggle}
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
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[#fb923c] transition-opacity duration-200 ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <Icon
                      size={18}
                      className="shrink-0 transition-all duration-200 group-hover:scale-110"
                    />
                    {expanded && <span className="truncate">{label}</span>}
                  </>
                )}
              </NavLink>

              {!expanded && (
                <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-900 border border-[#fb923c]/30 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none z-50">
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
                    <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-900 border border-[#fb923c]/30 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none z-50">
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
              {expanded && <span>Profile</span>}
            </NavLink>

            {!expanded && (
              <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-900 border border-[#fb923c]/30 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none z-50">
                Profile
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
