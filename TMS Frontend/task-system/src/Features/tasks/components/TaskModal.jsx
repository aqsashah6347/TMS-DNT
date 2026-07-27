import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

const priorityOptions = ["low", "medium", "high", "critical"].map((v) => ({
  value: v,
  label: v,
}));
const ALL_STATUS_OPTIONS = ["backlog", "in progress", "review", "done"].map(
  (v) => ({
    value: v,
    label: v,
  }),
);

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
        : priorityColorHex[editingTask.priority]
      : editingTask.color || priorityColorHex[editingTask.priority]
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

  function commitProgress(raw) {
    const num = clamp(
      Number.isNaN(parseInt(raw, 10)) ? 0 : parseInt(raw, 10),
      0,
      100,
    );
    setProgressInput(num);
    if (editingTask && num !== editingTask.progress) {
      updateTask(editingTask.id, { progress: num });
    }
  }

  // 7-day progress trend, starting from the task's creation date —
  // fetched fresh whenever the modal opens in view mode for a task.
  const [progressHistory, setProgressHistory] = useState([]);

  useEffect(() => {
    if (!isTaskModalOpen || modalMode !== "view" || !editingTask?.id) return;
    taskApi
      .getProgressHistory(editingTask.id)
      .then(setProgressHistory)
      .catch(() => setProgressHistory([]));
  }, [isTaskModalOpen, modalMode, editingTask?.id]);

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
  const [form, setForm] = useState(() =>
    editingTask
      ? {
          ...editingTask,
          assignedTo: editingTask.assignedTo
            ? String(editingTask.assignedTo)
            : "",
          color: editingTask.color || TASK_COLORS[0],
        }
      : { ...emptyForm, projectId: pendingProjectId || null },
  );

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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
                  className="mask-progress-bar"
                  style={{
                    flex: 1,
                    backgroundImage: `linear-gradient(${accentColor}, ${accentColor})`,
                    backgroundSize: `${progressInput}% 100%`,
                  }}
                />
                <div className="tvm-progress-value">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    onBlur={(e) => commitProgress(e.target.value)}
                    className="tvm-progress-input"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {/* Charts — 7-day trend from creation date, and a completion pie */}
            <div className="tvm-charts-row">
              <div className="tvm-chart-box tvm-chart-bar">
                <BarChart
                  dataset={progressHistory}
                  xAxis={[
                    {
                      dataKey: "day",
                      scaleType: "band",
                      tickLabelPlacement: "middle",
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
                    "& .MuiChartsAxis-tickLabel": { fill: "#9ca3af" },
                    "& .MuiChartsAxis-line": {
                      stroke: "rgba(255,255,255,0.15)",
                    },
                    "& .MuiChartsAxis-tick": {
                      stroke: "rgba(255,255,255,0.15)",
                    },
                  }}
                />
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
