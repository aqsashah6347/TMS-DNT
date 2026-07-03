import { Search, Bell } from "lucide-react";

export default function Header({ userName = "User" }) {
  return (
    <header className="h-16 bg-surface border-b border-primary-light flex items-center justify-between px-6">
      <div className="flex items-center gap-2 bg-bg rounded-card px-4 py-2 w-80">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm text-dark placeholder:text-muted w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-primary-light transition-colors">
          <Bell size={18} className="text-dark" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-dark font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-dark">{userName}</span>
        </div>
      </div>
    </header>
  );
}
