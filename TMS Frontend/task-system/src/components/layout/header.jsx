import { useState, useRef, useEffect } from "react";
import { Search, Bell, X, ListTodo, FolderKanban, Users } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useActivityStore } from "../../Features/activities/activityStore";
import { useTaskStore } from "../../Features/tasks/taskStore";
import { useProjectStore } from "../../Features/projects/projectStore";
import { useTeamStore } from "../../Features/teams/teamStore";
import { taskApi } from "../../api/taskApi";
import { projectApi } from "../../api/projectApi";
import { teamApi } from "../../api/teamApi";
import ProfileMenu from "./ProfileMenu";
import Avatar from "../ui/Avatar";
import Logo from "./logo";
import { useNavigate } from "react-router-dom";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const EMPTY_RESULTS = { tasks: [], projects: [], teams: [] };

export default function Header() {
  const { user } = useAuthStore();
  const { activities, unreadCount, fetchActivities, markAsRead } =
    useActivityStore();

  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(EMPTY_RESULTS);

  const bellRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // The bell + dashboard's InboxPreview both read from this same store, so
  // fetching once here keeps everything in sync with the real Activity Log.
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced global search across tasks, projects and teams.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }

    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const lower = q.toLowerCase();
        const [tasks, allProjects, allTeams] = await Promise.all([
          taskApi.getAllTasks({ search: q }),
          projectApi.getAllProjects(),
          teamApi.getAllTeams(),
        ]);

        const projects = allProjects
          .filter(
            (p) =>
              p.name?.toLowerCase().includes(lower) ||
              p.description?.toLowerCase().includes(lower),
          )
          .slice(0, 5);

        const teams = allTeams
          .filter((t) => t.name?.toLowerCase().includes(lower))
          .slice(0, 5);

        setResults({ tasks: tasks.slice(0, 5), projects, teams });
      } catch (err) {
        console.error("Global search failed:", err);
        setResults(EMPTY_RESULTS);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  function goToTask(task) {
    useTaskStore.getState().openTaskView(task);
    navigate("/tasks");
    closeSearch();
  }

  function goToProject(project) {
    useProjectStore.getState().openProjectView(project);
    navigate("/projects");
    closeSearch();
  }

  function goToTeam(team) {
    if (user?.role === "admin") {
      useTeamStore.getState().openEditModal(team);
    }
    navigate("/teams");
    closeSearch();
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
  }

  const count = unreadCount;
  const hasResults =
    results.tasks.length > 0 ||
    results.projects.length > 0 ||
    results.teams.length > 0;

  return (
    <>
      <header className="hash-bar fixed top-0 left-0 right-0 z-30 h-16 flex items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Logo size={26} />

          <h1 className="text-lg font-semibold tracking-wide text-orange-400 whitespace-nowrap">
            Task Management System
          </h1>
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-4">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <div className="flex items-center gap-2 w-72 rounded-full border border-white/10 bg-[#2a2d34] px-4 py-2 transition-all duration-300 hover:border-orange-500/60 focus-within:border-orange-500 focus-within:shadow-[0_0_18px_rgba(249,115,22,0.25)]">
              <Search size={16} className="text-orange-400" />

              <input
                type="text"
                value={query}
                placeholder="Search tasks, projects, teams..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
              />

              {query && (
                <button
                  onClick={closeSearch}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {searchOpen && query.trim().length >= 2 && (
              <div className="glass-dropdown-menu absolute right-0 top-full z-30 mt-2 max-h-96 w-96 overflow-y-auto rounded-3xl">
                {searching ? (
                  <p className="py-6 text-center text-sm text-white/50">
                    Searching...
                  </p>
                ) : !hasResults ? (
                  <p className="py-6 text-center text-sm text-white/50">
                    No results for "{query}"
                  </p>
                ) : (
                  <div className="py-2">
                    {results.tasks.length > 0 && (
                      <div className="px-2 pb-2">
                        <p className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                          <ListTodo size={12} /> Tasks
                        </p>
                        {results.tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => goToTask(task)}
                            className="w-full text-left px-2 py-2 rounded-xl text-sm text-white hover:bg-white/10 transition-colors truncate"
                          >
                            {task.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {results.projects.length > 0 && (
                      <div className="px-2 pb-2">
                        <p className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                          <FolderKanban size={12} /> Projects
                        </p>
                        {results.projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => goToProject(project)}
                            className="w-full text-left px-2 py-2 rounded-xl text-sm text-white hover:bg-white/10 transition-colors truncate"
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {results.teams.length > 0 && (
                      <div className="px-2 pb-2">
                        <p className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                          <Users size={12} /> Teams
                        </p>
                        {results.teams.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => goToTeam(team)}
                            className="w-full text-left px-2 py-2 rounded-xl text-sm text-white hover:bg-white/10 transition-colors truncate"
                          >
                            {team.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications — now wired to the real Activity Log data */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            >
              <Bell size={17} className="text-white/70" />

              {count > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              )}
            </button>

            {bellOpen && (
              <div className="glass-dropdown-menu absolute right-0 top-full z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-3xl">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                </div>

                {activities.length === 0 ? (
                  <p className="py-6 text-center text-sm text-white/50">
                    No notifications
                  </p>
                ) : (
                  activities.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        if (!a.read) markAsRead(a.id);
                        setBellOpen(false);
                        navigate("/activity");
                      }}
                      className={`w-full border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 ${
                        !a.read ? "bg-white/5" : ""
                      }`}
                    >
                      <p className="text-xs leading-snug text-white">
                        {a.title || a.message}
                      </p>

                      <p className="mt-1 text-[11px] text-white/40">
                        {timeAgo(a.createdAt)}
                      </p>
                    </button>
                  ))
                )}

                <button
                  onClick={() => {
                    setBellOpen(false);
                    navigate("/activity");
                  }}
                  className="w-full py-2.5 text-center text-xs font-medium text-orange-300 transition-colors hover:bg-white/10"
                >
                  View all
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white/10"
          >
            <Avatar name={user?.name} color={user?.avatarColor} size={32} />

            <span className="text-sm font-medium text-white">
              {user?.name || "Guest"}
            </span>
          </button>
        </div>
      </header>

      <ProfileMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
