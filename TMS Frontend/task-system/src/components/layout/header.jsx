import { Search, Bell } from "lucide-react";

export default function Header({ userName = "User" }) {
  return (
    /* Changed to bg-topbar (pure white), text color to dark, and light subtle bottom border */
    <header className="h-16 bg-topbar flex items-center justify-between px-6 border-b border-muted/10 shadow-sm">
      {/* Search Input Container: Changed from white/10 to bg-bg (mint off-white) so it stands out against the white header */}
      <div className="flex items-center gap-2 bg-bg rounded-card px-4 py-2 w-80 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm text-dark placeholder:text-muted/60 w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell: Swapped hover ring and icon color for light theme compliance */}
        <button className="relative p-2 rounded-full hover:bg-bg transition-colors">
          <Bell size={18} className="text-dark" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2">
          {/* User Profile Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-dark font-semibold text-sm shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-dark">{userName}</span>
        </div>
      </div>
    </header>
  );
}
