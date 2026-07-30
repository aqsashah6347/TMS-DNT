import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useTaskStore } from "../taskStore";
import { useProjectStore } from "../../projects/projectStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { usersApi } from "../../../api/usersApi";
import { employeesApi } from "../../../api/employeesApi";
import { taskApi } from "../../../api/taskApi";
import { getProjectColor } from "../../../utils/projectColors";
import { useUIStore } from "../../../store/useUIStore";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  Pencil,
  Pin,
  PinOff,
  Video,
  GitBranch,
  ExternalLink,
  Calendar,
  User,
  Flag,
  Folder,
  CheckCircle2,
  Check,
  Loader2,
} from "lucide-react";

const priorityOptions = ["low", "medium", "high", "critical"].map((v) => ({
  value: v,
  label: v,
}));

const difficultyOptions = [
  { value: "1", label: "1 — Low" },
  { value: "2", label: "2 — Medium" },
  { value: "3", label: "3 — High" },
  { value: "4", label: "4 — Critical" },
];

const ALL_STATUS_OPTIONS = ["backlog", "in progress", "review", "done"].map(
  (v) => ({
    value: v,
    label: v,
  }),
);
const [actualHoursInput, setActualHoursInput] = useState("");
const [qualityRatingInput, setQualityRatingInput] = useState("");

const priorityBadgeMap = {
  critical: "glass-badge--danger",
  high: "glass-badge--amber",
  medium: "glass-badge--violet",
  low: "glass-badge--primary",
};

// Same status -> badge class mapping as TaskCard.jsx, kept in sync so a
// task's status pill looks identical whether you're looking at the card
// or the modal.
const statusBadgeMap = {
  backlog: "glass-badge--primary",
  todo: "glass-badge--primary",
  "in progress": "glass-badge--violet",
  review: "glass-badge--amber",
  done: "glass-badge--rose",
};

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// Builds the big month label shown under the progress chart, e.g. "July"
// or "July – August" if the task's creation→due-date range crosses months.
function getProgressChartMonthLabel(history) {
  if (!history || history.length === 0) return "";
  // Fallback bars (no valid due date) come back with date: null — show a
  // dash instead of trying to derive a month from nothing.
  if (!history[0].date) return "-";
  const first = new Date(history[0].date);
  const last = new Date(history[history.length - 1].date);
  const firstMonthName = first.toLocaleDateString("en-US", { month: "long" });
  const sameMonth =
    first.getMonth() === last.getMonth() &&
    first.getFullYear() === last.getFullYear();
  if (sameMonth) return firstMonthName;
  const lastMonthName = last.toLocaleDateString("en-US", { month: "long" });
  return `${firstMonthName} – ${lastMonthName}`;
}

// Palette a user picks from when a task has no project (same rotating-swatch
// pattern as PROJECT_COLORS / TEAM_COLORS elsewhere in the app).
const TASK_COLORS = [
  "#d68394", // rose (app accent)
  "#70b3b1", // teal
  "#d3b19a", // sand
  "#8ea8d0", // dusty blue
  "#b490f5", // violet
  "#a8c98a", // sage
  "#f2c6a0", // apricot
  "#f87171", // coral
];
const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
  status: "backlog",
  dueDate: "",
  assignedTo: "",
  zoomLink: "",
  githubLink: "",
  projectId: null,
  color: TASK_COLORS[0],
  difficultyLevel: 2,
  estimatedHours: "",
};

export default function TaskModal() {
  const {
    isTaskModalOpen,
    editingTask,
    modalMode,
    closeTaskModal,
    openTaskEdit,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    togglePin,
    pendingProjectId,
  } = useTaskStore();
  const { user } = useAuthStore();
  const canManageTasks = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";
  // Marking a task complete is restricted to just its creator and its
  // assignee — regardless of role, so an admin/manager who is neither
  // can't complete someone else's task on their behalf. Editing other
  // fields is unaffected; this only gates the completion action.
  const canCompleteTask =
    !!editingTask &&
    !!user &&
    (user.id === editingTask.assignedTo || user.id === editingTask.assignedBy);

  const { projects, fetchProjects } = useProjectStore();

  // Same color precedence as TaskCard's accentColor: project color wins
  // when the task belongs to a project, otherwise the task's own saved
  // color, otherwise a priority-based fallback. Used to tint the
  // "flies to Completed Log" bubble so it matches the card the user just
  // completed.
  const priorityColorHex = {
    critical: "#f87171",
    high: "#ffd27f",
    medium: "#b490f5",
    low: "#a1a1aa",
  };
  const rawProjectColor = editingTask
    ? getProjectColor(editingTask.projectId, projects)
    : null;
  const hasValidProjectColor =
    rawProjectColor &&
    rawProjectColor !== "#ffffff" &&
    rawProjectColor !== "#fff";
  const accentColor = editingTask
    ? editingTask.projectId
      ? hasValidProjectColor
        ? rawProjectColor
        : priorityColorHex[editingTask.priority] || "#fb923c"
      : editingTask.color || priorityColorHex[editingTask.priority] || "#fb923c"
    : "#fb923c";

  // Assignable users — usersApi.getAssignableUsers() already returns just
  // this manager's team for managers and everyone for admins, so no
  // team-filtering logic needs to live here.
  const [assignableUsers, setAssignableUsers] = useState([]);
  // Roster is only fetched for admins, purely to get each person's
  // department for the tab bar (same source TeamMemberPicker.jsx uses).
  const [roster, setRoster] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Local mirror of editingTask.progress so the number field feels
  // instant to type in, while the actual save still goes through
  // updateTask (on blur) so it's clamped 0-100 and persisted the same
  // way any other field edit is.
  const [progressInput, setProgressInput] = useState(
    editingTask?.progress ?? 0,
  );

  // Save-feedback for the progress control: 'idle' the rest of the time,
  // 'saving' while the request is in flight, 'saved' briefly after it
  // succeeds (auto-reverts to 'idle'), 'error' if it fails.
  const [progressSaveState, setProgressSaveState] = useState("idle");
  const progressSaveTimeoutRef = useRef(null);

  async function handleComplete(e) {
    if (!editingTask) return;
    const rect = e.currentTarget.getBoundingClientRect();
    useUIStore.getState().fireCompletionBubble({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color: accentColor,
    });
    setIsCompleting(true);
    await completeTask(editingTask.id, {
      actualHours: actualHoursInput === "" ? null : Number(actualHoursInput),
      qualityRating:
        qualityRatingInput === "" ? null : Number(qualityRatingInput),
    });
    setIsCompleting(false);
    closeTaskModal();
  }

  async function commitProgress(raw) {
    const num = clamp(
      Number.isNaN(parseInt(raw, 10)) ? 0 : parseInt(raw, 10),
      0,
      100,
    );
    setProgressInput(num);
    if (editingTask && num !== editingTask.progress) {
      clearTimeout(progressSaveTimeoutRef.current);
      setProgressSaveState("saving");
      const ok = await updateTask(editingTask.id, { progress: num });
      setProgressSaveState(ok ? "saved" : "error");
      progressSaveTimeoutRef.current = setTimeout(
        () => setProgressSaveState("idle"),
        1500,
      );
    }
  }

  useEffect(() => {
    return () => clearTimeout(progressSaveTimeoutRef.current);
  }, []);

  // Click (or drag) anywhere along the progress track to jump straight to
  // that percentage, instead of only being able to type a number.
  function handleProgressBarPointer(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const pct = clamp(Math.round(ratio * 100), 0, 100);
    setProgressInput(pct);
    commitProgress(pct);
  }

  // Progress trend from creation date to due date — fetched fresh whenever
  // the modal opens in view mode for a task.
  const [progressHistory, setProgressHistory] = useState([]);
  const progressChartMonth = useMemo(
    () => getProgressChartMonthLabel(progressHistory),
    [progressHistory],
  );

  useEffect(() => {
    if (!isTaskModalOpen || modalMode !== "view" || !editingTask?.id) return;
    taskApi
      .getProgressHistory(editingTask.id)
      .then(setProgressHistory)
      .catch(() => setProgressHistory([]));
  }, [isTaskModalOpen, modalMode, editingTask?.id]);

  // FIX: this used to sync state directly in the render body
  // (`if (...) { setSyncedTaskId(...); setProgressInput(...); }` with no
  // useEffect wrapper). Because `editingTask` is a fresh object reference
  // from the Zustand store on every render, that pattern could re-trigger
  // the setState calls on every single render and never let React settle,
  // which is exactly what threw "Too many re-renders" in TaskModal.
  // Moving it into a useEffect runs it after commit instead of during
  // render, so it can't cause this loop.
  const [syncedTaskId, setSyncedTaskId] = useState(editingTask?.id ?? null);
  useEffect(() => {
    if (!isTaskModalOpen) return;
    const currentId = editingTask?.id ?? null;
    if (currentId !== syncedTaskId) {
      setSyncedTaskId(currentId);
      setProgressInput(editingTask?.progress ?? 0);
    }
  }, [isTaskModalOpen, editingTask?.id, editingTask?.progress, syncedTaskId]);

  useEffect(() => {
    if (!isTaskModalOpen) return;
    usersApi
      .getAssignableUsers()
      .then(setAssignableUsers)
      .catch(() => setAssignableUsers([]));
  }, [isTaskModalOpen]);

  useEffect(() => {
    if (!isTaskModalOpen || !isAdmin) return;
    employeesApi
      .getRoster()
      .then((data) => setRoster(data.employees || []))
      .catch(() => setRoster([]));
  }, [isTaskModalOpen, isAdmin]);

  // Projects load once (from the Projects page) but the Task modal can be
  // opened before that ever happens — e.g. straight from the Tasks page —
  // so make sure the dropdown always has data to show.
  useEffect(() => {
    if (isTaskModalOpen && projects.length === 0) {
      fetchProjects();
    }
  }, [isTaskModalOpen, projects.length, fetchProjects]);

  // Hide "done" as a selectable status for anyone who isn't allowed to
  // complete this task, so the dropdown can't be used to sneak past the
  // same rule the backend enforces. A task that's already done keeps
  // "done" visible so its current value still shows correctly.
  const statusOptions =
    !editingTask || canCompleteTask || editingTask.status === "done"
      ? ALL_STATUS_OPTIONS
      : ALL_STATUS_OPTIONS.filter((o) => o.value !== "done");

 const formKey = editingTask?.id ?? `new-${pendingProjectId ?? "none"}`;

 function buildInitialForm() {
   return editingTask
     ? {
         ...editingTask,
         assignedTo: editingTask.assignedTo
           ? String(editingTask.assignedTo)
           : "",
         color: editingTask.color || TASK_COLORS[0],
       }
     : { ...emptyForm, projectId: pendingProjectId || null };
 }

 const [form, setForm] = useState(buildInitialForm);

 useEffect(() => {
   if (isTaskModalOpen) {
     setForm(buildInitialForm());
   }
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [isTaskModalOpen, formKey]);
  // employee.userId links a roster row to its real tms_users account —
  // only those rows are relevant for tagging an assignable user's department.
  const departmentByUserId = useMemo(() => {
    const map = {};
    roster.forEach((emp) => {
      if (emp.userId) map[String(emp.userId)] = emp.department || "Unassigned";
    });
    return map;
  }, [roster]);

  const assigneeOptions = [
    { value: "", label: "Unassigned", group: "all" },
    ...assignableUsers.map((u) => ({
      value: String(u.id),
      label: u.name,
      group: isAdmin
        ? departmentByUserId[String(u.id)] || "Unassigned"
        : undefined,
    })),
  ];

  // Tabs only make sense for admins, since managers already get a
  // pre-filtered (single-team) list from the backend.
  const departmentTabs = isAdmin
    ? [
        { key: "all", label: "All" },
        ...Array.from(
          new Set(
            assignableUsers.map(
              (u) => departmentByUserId[String(u.id)] || "Unassigned",
            ),
          ),
        )
          .sort((a, b) => a.localeCompare(b))
          .map((dept) => ({ key: dept, label: dept })),
      ]
    : null;

  const projectOptions = [
    { value: "", label: "No project" },
    ...projects.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  const selectedProject = projects.find(
    (p) => p.id === (editingTask?.projectId ?? form.projectId),
  );

  // Live project color — looked up the same way TaskCard.jsx does, so the
  // preview always matches the project's *current* color even if form.color
  // (the task's own standalone color) is stale from before it was linked.
  const inheritedColor = form.projectId
    ? getProjectColor(form.projectId, projects)
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!(form.title || "").trim()) return;

    setFormError(null);
    setIsSubmitting(true);
    // When a task belongs to a project, its color comes from the project
    // (see TaskCard.jsx / TaskKanbanView.jsx), so don't send a stale
    // standalone color that could shadow it.
    const payload = { ...form };
    if (payload.projectId) {
      delete payload.color;
    }

    const ok = editingTask
      ? await updateTask(editingTask.id, payload)
      : await addTask(payload);

    setIsSubmitting(false);

    if (!ok) {
      setFormError(useTaskStore.getState().error);
      return;
    }

    if (editingTask) {
      useTaskStore.setState({ modalMode: "view" });
    } else {
      closeTaskModal();
    }
  }

  async function handleDelete() {
    if (editingTask) await deleteTask(editingTask.id);
    closeTaskModal();
  }

  async function handleComplete(e) {
    if (!editingTask) return;
    const rect = e.currentTarget.getBoundingClientRect();
    useUIStore.getState().fireCompletionBubble({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color: accentColor,
    });
    setIsCompleting(true);
    await completeTask(editingTask.id);
    setIsCompleting(false);
    closeTaskModal();
  }

  const isEditing = modalMode === "edit";
  const title = !editingTask
    ? "New Task"
    : isEditing
      ? "Edit Task"
      : editingTask.title;

  // Completion pie — split of current progress vs remaining, tinted with
  // the task's real accent color instead of MUI's default palette.
  const pieData = editingTask
    ? [
        { id: 0, value: progressInput, label: "Completed", color: accentColor },
        {
          id: 1,
          value: 100 - progressInput,
          label: "Remaining",
          color: "#3a3a3a",
        },
      ]
    : [];

  return (
    <Modal
      key={formKey}
      isOpen={isTaskModalOpen}
      onClose={closeTaskModal}
      title={title}
    >
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Fix login bug"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional details..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dropdown
              label="Priority"
              value={form.priority}
              onChange={(v) => setForm({ ...form, priority: v })}
              options={priorityOptions}
            />
            <Dropdown
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={statusOptions}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dropdown
              label="Difficulty Level"
              value={String(form.difficultyLevel ?? 2)}
              onChange={(v) => setForm({ ...form, difficultyLevel: Number(v) })}
              options={difficultyOptions}
            />
            <Input
              label="Estimated Hours"
              type="number"
              min="0"
              step="0.5"
              value={form.estimatedHours ?? ""}
              onChange={(e) =>
                setForm({ ...form, estimatedHours: e.target.value })
              }
              placeholder="e.g. 8"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate || ""}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Dropdown
              label="Assigned To"
              value={form.assignedTo}
              onChange={(v) => setForm({ ...form, assignedTo: v })}
              options={assigneeOptions}
              searchable
              tabs={departmentTabs}
              placeholder="Select an assignee"
            />
          </div>

          <Dropdown
            label="Project"
            value={form.projectId ? String(form.projectId) : ""}
            onChange={(v) =>
              setForm({ ...form, projectId: v ? Number(v) : null })
            }
            options={projectOptions}
            searchable
            placeholder="No project"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Task Color
            </label>
            {form.projectId ? (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span
                  className="w-5 h-5 rounded-full border border-bg shrink-0"
                  style={{ backgroundColor: inheritedColor }}
                />
                Matches {selectedProject?.name || "project"}'s color
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {TASK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-6 h-6 rounded-full border-2 transition-transform"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? "#001021" : "transparent",
                      transform: form.color === c ? "scale(1.1)" : "scale(1)",
                    }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Zoom link"
              value={form.zoomLink}
              onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
              placeholder="https://zoom.us/..."
            />
            <Input
              label="GitHub link"
              value={form.githubLink}
              onChange={(e) => setForm({ ...form, githubLink: e.target.value })}
              placeholder="https://github.com/..."
            />
          </div>

          {formError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            {editingTask ? (
              <Button variant="danger" type="button" onClick={handleDelete}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() =>
                  editingTask
                    ? useTaskStore.setState({ modalMode: "view" })
                    : closeTaskModal()
                }
              >
                {editingTask ? "Back" : "Cancel"}
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingTask
                    ? "Save Changes"
                    : "Create Task"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        editingTask && (
          <div className="tvm-body">
            {/* Project name + pin, right under the modal's own title bar */}
            <div className="tvm-top-row">
              <span className="tvm-project-name">
                {selectedProject ? (
                  <>
                    <Folder size={13} className="tvm-project-icon" />
                    {selectedProject.name}
                  </>
                ) : (
                  "No project"
                )}
              </span>
              <button
                onClick={() => togglePin(editingTask.id)}
                className="tvm-pin-btn"
              >
                {editingTask.pinned ? (
                  <>
                    <PinOff size={13} /> Unpin
                  </>
                ) : (
                  <>
                    <Pin size={13} /> Pin to top
                  </>
                )}
              </button>
            </div>

            <div className="tvm-divider" />

            {/* Description + priority/status badges */}
            <div className="tvm-desc-row">
              <div className="tvm-desc-col">
                <p className="tvm-label">Description:</p>
                {editingTask.description ? (
                  <p className="tvm-desc-text">{editingTask.description}</p>
                ) : (
                  <p className="tvm-desc-text tvm-desc-empty">
                    No description yet.
                  </p>
                )}
              </div>
              <div className="tvm-badge-col">
                <span
                  className={`glass-badge ${priorityBadgeMap[editingTask.priority]} tvm-pill`}
                >
                  <Flag size={11} className="tvm-pill-icon" />
                  {editingTask.priority}
                </span>
                <span
                  className={`glass-badge ${statusBadgeMap[editingTask.status] || "glass-badge--primary"} tvm-pill`}
                >
                  {editingTask.status}
                </span>
                {editingTask.difficultyLevel && (
                  <span className="glass-badge glass-badge--violet tvm-pill">
                    Difficulty {editingTask.difficultyLevel}/4
                  </span>
                )}
                {editingTask.estimatedHours && (
                  <span className="glass-badge glass-badge--primary tvm-pill">
                    Est. {editingTask.estimatedHours}h
                  </span>
                )}
              </div>
            </div>

            {/* Github / Zoom link rows */}
            {editingTask.githubLink && (
              <a
                href={editingTask.githubLink}
                target="_blank"
                rel="noreferrer"
                className="tvm-link-row"
              >
                <span className="tvm-link-left">
                  <GitBranch size={16} />
                  Github:
                </span>
                <ExternalLink size={14} className="tvm-link-icon" />
              </a>
            )}

            {editingTask.zoomLink && (
              <a
                href={editingTask.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="tvm-link-row"
              >
                <span className="tvm-link-left">
                  <Video size={16} />
                  Meeting:
                </span>
                <ExternalLink size={14} className="tvm-link-icon" />
              </a>
            )}

            {(editingTask.dueDate ||
              editingTask.assignedToName ||
              editingTask.assignedByName) && (
              <div className="tvm-meta-row">
                {editingTask.dueDate && (
                  <span className="tvm-meta-item">
                    <Calendar size={13} /> Due {editingTask.dueDate}
                  </span>
                )}
                {editingTask.assignedToName && (
                  <span className="tvm-meta-item">
                    <User size={13} /> {editingTask.assignedToName}
                  </span>
                )}
                {editingTask.assignedByName && (
                  <span className="tvm-meta-item">
                    <User size={13} /> By {editingTask.assignedByName}
                  </span>
                )}
              </div>
            )}

            {/* Progress — editable 0-100, clamped */}
            <div className="tvm-progress-block">
              <p className="tvm-label">Task Progress:</p>
              <div className="tvm-progress-row">
                <div
                  className="mask-progress-bar tvm-progress-bar--clickable"
                  role="slider"
                  aria-label="Task progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressInput || 0}
                  tabIndex={0}
                  title="Click to set progress"
                  style={{
                    flex: 1,
                    backgroundImage: `linear-gradient(${accentColor}, ${accentColor})`,
                    backgroundSize: `${progressInput}% 100%`,
                  }}
                  onClick={handleProgressBarPointer}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight")
                      commitProgress((progressInput || 0) + 1);
                    if (e.key === "ArrowLeft")
                      commitProgress((progressInput || 0) - 1);
                  }}
                />
                <div className="tvm-progress-value">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // Let the field go empty while the user is
                      // clearing it to retype, but never let a typed
                      // number sit outside 0-100 even before blur.
                      if (raw === "") {
                        setProgressInput("");
                        return;
                      }
                      const num = clamp(parseInt(raw, 10) || 0, 0, 100);
                      setProgressInput(num);
                    }}
                    onBlur={(e) => commitProgress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    className="tvm-progress-input"
                  />
                  <span>%</span>
                  <span
                    className={`tvm-progress-status tvm-progress-status--${progressSaveState}`}
                    aria-live="polite"
                  >
                    {progressSaveState === "saving" && (
                      <Loader2
                        size={14}
                        className="tvm-progress-status__spin"
                      />
                    )}
                    {progressSaveState === "saved" && (
                      <>
                        <Check size={14} />
                        Saved
                      </>
                    )}
                    {progressSaveState === "error" && "Couldn't save"}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts — trend from creation date to due date, and a completion pie */}
            <div className="tvm-charts-row">
              <div className="tvm-chart-box tvm-chart-bar">
                {progressHistory.length > 0 ? (
                  <>
                    <BarChart
                      dataset={progressHistory}
                      colors={[accentColor]}
                      xAxis={[
                        {
                          dataKey: "day",
                          scaleType: "band",
                          tickLabelPlacement: "middle",
                          valueFormatter: (v) =>
                            typeof v === "string" && v.startsWith("dash-")
                              ? "-"
                              : v,
                        },
                      ]}
                      yAxis={[{ min: 0, max: 100, width: 30 }]}
                      series={[
                        {
                          dataKey: "progress",
                          label: "Progress",
                          color: accentColor,
                          valueFormatter: (v) => `${v}%`,
                        },
                      ]}
                      height={140}
                      margin={{ left: 30, right: 8, top: 8, bottom: 24 }}
                      slotProps={{ legend: { hidden: true } }}
                      sx={{
                        // Explicit fill on the bar elements themselves —
                        // without this they were rendering solid black
                        // instead of picking up the series `color`.
                        "& .MuiBarElement-root": {
                          fill: accentColor,
                        },
                        "& .MuiChartsAxis-tickLabel": {
                          fill: "#9ca3af",
                          fontSize: 11,
                        },
                        "& .MuiChartsAxis-line": {
                          stroke: "rgba(255,255,255,0.45)",
                          strokeWidth: 1.5,
                        },
                        "& .MuiChartsAxis-tick": {
                          stroke: "rgba(255,255,255,0.45)",
                        },
                      }}
                    />
                    <p className="text-center text-sm font-semibold text-white/70 tracking-wide -mt-1">
                      {progressChartMonth}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-white/40 italic py-8 text-center">
                    No progress history yet.
                  </p>
                )}
              </div>
              <div className="tvm-chart-box">
                <PieChart
                  series={[
                    {
                      data: pieData,
                      innerRadius: 0,
                      outerRadius: 40,
                    },
                  ]}
                  width={140}
                  height={120}
                  slotProps={{ legend: { hidden: true } }}
                />
              </div>
            </div>

            <div className="tvm-divider" />
            {canCompleteTask && editingTask.status !== "done" && (
              <div className="tvm-progress-block">
                <p className="tvm-label">Completion Details:</p>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/40">
                      Actual Hours Spent
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={actualHoursInput}
                      onChange={(e) => setActualHoursInput(e.target.value)}
                      placeholder="e.g. 6.5"
                      className="tvm-progress-input w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/40">
                      Quality Rating (0–100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={qualityRatingInput}
                      onChange={(e) => setQualityRatingInput(e.target.value)}
                      placeholder="e.g. 90"
                      className="tvm-progress-input w-full"
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Footer */}
            <div className="tvm-footer">
              {canManageTasks ? (
                <button
                  className="tvm-btn-edit"
                  onClick={() => openTaskEdit(editingTask)}
                >
                  <Pencil size={14} className="tvm-pill-icon" /> Edit
                </button>
              ) : (
                <span />
              )}

              {editingTask.status === "done" ? (
                <span className="tvm-completed-label">
                  <CheckCircle2 size={14} /> Completed
                </span>
              ) : canCompleteTask ? (
                <button
                  className="tvm-btn-complete"
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  <CheckCircle2 size={14} className="tvm-pill-icon" />
                  {isCompleting ? "Completing…" : "Mark Complete"}
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        )
      )}
    </Modal>
  );
}
