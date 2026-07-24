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
import { getProjectColor } from "../../../utils/projectColors";
import { useUIStore } from "../../../store/useUIStore";
import {
  Pencil,
  Pin,
  PinOff,
  Video,
  GitBranch,
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="w-3 h-3 rounded-full border border-bg shrink-0"
                style={{
                  backgroundColor: editingTask.projectId
                    ? getProjectColor(editingTask.projectId, projects)
                    : editingTask.color || TASK_COLORS[0],
                }}
              />
              <span
                className={`glass-badge ${priorityBadgeMap[editingTask.priority]}`}
              >
                <Flag size={10} className="inline mr-1 -mt-0.5" />
                {editingTask.priority}
              </span>
              <span className="glass-badge glass-badge--violet">
                {editingTask.status}
              </span>
              {selectedProject && (
                <span
                  className="glass-badge flex items-center gap-1"
                  style={{
                    backgroundColor: `${selectedProject.color}33`,
                    color: selectedProject.color,
                  }}
                >
                  <Folder size={10} />
                  {selectedProject.name}
                </span>
              )}
            </div>

            {editingTask.description && (
              <p className="text-sm text-muted">{editingTask.description}</p>
            )}

            <div className="flex flex-col gap-2 text-sm">
              {editingTask.dueDate && (
                <div className="flex items-center gap-2 text-dark">
                  <Calendar size={14} className="text-muted" /> Due{" "}
                  {editingTask.dueDate}
                </div>
              )}
              {editingTask.assignedToName && (
                <div className="flex items-center gap-2 text-dark">
                  <User size={14} className="text-muted" /> Assigned to{" "}
                  {editingTask.assignedToName}
                </div>
              )}
              {editingTask.assignedByName && (
                <div className="flex items-center gap-2 text-dark">
                  <User size={14} className="text-muted" /> Created by{" "}
                  {editingTask.assignedByName}
                </div>
              )}
            </div>

            {(editingTask.zoomLink || editingTask.githubLink) && (
              <div className="flex flex-col gap-2 border-t border-bg pt-3">
                {editingTask.zoomLink && (
                  <a
                    href={editingTask.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Video size={14} /> Join Zoom
                  </a>
                )}
                {editingTask.githubLink && (
                  <a
                    href={editingTask.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <GitBranch size={14} /> View on GitHub
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-bg">
              <button
                onClick={() => togglePin(editingTask.id)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-dark"
              >
                {editingTask.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                {editingTask.pinned ? "Unpin" : "Pin to top"}
              </button>

              <div className="flex items-center gap-2">
                {canManageTasks && (
                  <Button
                    variant="ghost"
                    onClick={() => openTaskEdit(editingTask)}
                  >
                    <Pencil size={14} className="inline mr-1.5 -mt-0.5" /> Edit
                  </Button>
                )}
                {editingTask.status === "done" ? (
                  <span className="flex items-center gap-1.5 text-xs text-success-text">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                ) : canCompleteTask ? (
                  <Button
                    variant="primary"
                    onClick={handleComplete}
                    disabled={isCompleting}
                  >
                    <CheckCircle2 size={14} className="inline mr-1.5 -mt-0.5" />
                    {isCompleting ? "Completing…" : "Mark Complete"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}
