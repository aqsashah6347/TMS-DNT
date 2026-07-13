import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useTaskStore } from "../taskStore";
import { usersApi } from "../../../api/usersApi";
import {
  Pencil,
  Pin,
  PinOff,
  Video,
  GitBranch,
  Calendar,
  User,
  Flag,
} from "lucide-react";

const priorityOptions = ["low", "medium", "high", "critical"].map((v) => ({
  value: v,
  label: v,
}));
const statusOptions = ["backlog", "in progress", "review", "done"].map((v) => ({
  value: v,
  label: v,
}));

const priorityBadgeMap = {
  critical: "glass-badge--danger",
  high: "glass-badge--amber",
  medium: "glass-badge--violet",
  low: "glass-badge--primary",
};

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
    togglePin,
    pendingProjectId,
  } = useTaskStore();

  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isTaskModalOpen) {
      usersApi
        .getAllUsers()
        .then(setUsers)
        .catch(() => setUsers([]));
    }
  }, [isTaskModalOpen]);

  const formKey = editingTask?.id ?? `new-${pendingProjectId ?? "none"}`;
  const [form, setForm] = useState(() =>
    editingTask
      ? {
          ...editingTask,
          assignedTo: editingTask.assignedTo
            ? String(editingTask.assignedTo)
            : "",
        }
      : { ...emptyForm, projectId: pendingProjectId || null },
  );

  const userOptions = [
    { value: "", label: "Unassigned" },
    ...users.map((u) => ({ value: String(u.id), label: u.name })),
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!(form.title || "").trim()) return;

    setFormError(null);
    setIsSubmitting(true);

    const ok = editingTask
      ? await updateTask(editingTask.id, form)
      : await addTask(form);

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
              options={userOptions}
            />
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
                className={`glass-badge ${priorityBadgeMap[editingTask.priority]}`}
              >
                <Flag size={10} className="inline mr-1 -mt-0.5" />
                {editingTask.priority}
              </span>
              <span className="glass-badge glass-badge--violet">
                {editingTask.status}
              </span>
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

              <Button
                variant="primary"
                onClick={() => openTaskEdit(editingTask)}
              >
                <Pencil size={14} className="inline mr-1.5 -mt-0.5" /> Edit
              </Button>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}
