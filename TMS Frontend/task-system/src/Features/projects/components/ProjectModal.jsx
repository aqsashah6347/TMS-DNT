import { useState, useEffect } from "react";
import { Plus, Pencil, CheckCircle2, Circle } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useProjectStore } from "../projectStore";
import { useTaskStore } from "../../tasks/taskStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { usersApi } from "../../../api/usersApi";
import { teamApi } from "../../../api/teamApi";
import { PROJECT_COLORS } from "../../../utils/projectColors";

const statusOptions = ["planning", "active", "completed"].map((v) => ({
  value: v,
  label: v,
}));
const emptyForm = {
  name: "",
  description: "",
  teamId: "",
  status: "planning",
  members: "",
  color: PROJECT_COLORS[0],
};

const getInitialForm = (project) => ({
  ...emptyForm,
  name: project?.name || emptyForm.name,
  description: project?.description || emptyForm.description,
  teamId: project?.teamId ? String(project.teamId) : emptyForm.teamId,
  status: project?.status || emptyForm.status,
  members: Array.isArray(project?.members)
    ? project.members.join(", ")
    : emptyForm.members,
  color: project?.color || emptyForm.color,
});

function ProjectForm({
  editingProject,
  users,
  teamOptions,
  addProject,
  updateProject,
  deleteProject,
  closeModal,
}) {
  const [form, setForm] = useState(() => getInitialForm(editingProject));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const isNew = !editingProject.id;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const names = form.members
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    const memberIds = [];
    const unmatched = [];

    for (const n of names) {
      const match = users.find((u) => u.name.toLowerCase() === n.toLowerCase());
      if (match) memberIds.push(match.id);
      else unmatched.push(n);
    }

    if (unmatched.length > 0) {
      setFormError(`No user found named: ${unmatched.join(", ")}`);
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      teamId: form.teamId ? Number(form.teamId) : null,
      status: form.status,
      color: form.color,
      members: memberIds,
    };

    setFormError(null);
    setIsSubmitting(true);

    const ok = editingProject?.id
      ? await updateProject(editingProject.id, payload)
      : await addProject(payload);

    setIsSubmitting(false);

    if (!ok) {
      setFormError(useProjectStore.getState().error);
      return;
    }

    if (editingProject?.id) {
      useProjectStore.setState({ modalMode: "view" });
    } else {
      closeModal();
    }
  }

  async function handleDelete() {
    if (editingProject?.id) await deleteProject(editingProject.id);
    closeModal();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Project name"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. DreamsPortal CRM"
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Optional details..."
      />

      <div className="grid grid-cols-2 gap-4">
        <Dropdown
          label="Team"
          value={form.teamId}
          onChange={(v) => setForm({ ...form, teamId: v })}
          options={teamOptions}
        />
        <Dropdown
          label="Status"
          value={form.status}
          onChange={(v) => setForm({ ...form, status: v })}
          options={statusOptions}
        />
      </div>

      <Input
        label="Members"
        value={form.members}
        onChange={(e) => setForm({ ...form, members: e.target.value })}
        placeholder="Comma-separated, e.g. Aqsa, Sara"
      />

      <div>
        <label className="text-xs font-medium text-muted mb-1.5 block">
          Project color
        </label>
        <div className="flex gap-2">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? "#001021" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {formError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        {!isNew ? (
          <Button
            variant="danger"
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
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
              isNew
                ? closeModal()
                : useProjectStore.setState({ modalMode: "view" })
            }
            disabled={isSubmitting}
          >
            {isNew ? "Cancel" : "Back"}
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : isNew
                ? "Create Project"
                : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function ProjectModal() {
  const {
    isModalOpen,
    editingProject,
    modalMode,
    closeModal,
    addProject,
    updateProject,
    deleteProject,
  } = useProjectStore();
  const { getTasksByProject, openTaskView, openCreateModalForProject } =
    useTaskStore();
  const { user } = useAuthStore();
  const canManageTasks = user?.role === "admin" || user?.role === "manager";

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!isModalOpen) return;

    usersApi
      .getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]));

    teamApi
      .getAllTeams()
      .then(setTeams)
      .catch(() => setTeams([]));
  }, [isModalOpen]);

  if (!editingProject) return null;

  const teamOptions = [
    { value: "", label: "No team" },
    ...teams.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const isEditing = modalMode === "edit";
  const isNew = !editingProject.id;
  const projectTasks = editingProject.id ? getTasksByProject(editingProject.id) : [];
  const doneCount = projectTasks.filter((t) => t.status === "done").length;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={
        isNew ? "New Project" : isEditing ? "Edit Project" : editingProject.name
      }
      width="max-w-2xl"
    >
      {isEditing ? (
        <ProjectForm
          key={`${editingProject.id ?? "new"}-${isModalOpen}`}
          editingProject={editingProject}
          users={users}
          teamOptions={teamOptions}
          addProject={addProject}
          updateProject={updateProject}
          deleteProject={deleteProject}
          closeModal={closeModal}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: editingProject.color }}
              />
              <span className="text-sm text-muted">
                {editingProject.teamName}
              </span>
            </div>
            <Button
              variant="primary"
              onClick={() => useProjectStore.setState({ modalMode: "edit" })}
            >
              <Pencil size={14} className="inline mr-1.5 -mt-0.5" /> Edit
            </Button>
          </div>

          {editingProject.description && (
            <p className="text-sm text-muted">{editingProject.description}</p>
          )}

          <div>
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Progress</span>
              <span>{editingProject.progress}%</span>
            </div>
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${editingProject.progress}%`,
                  backgroundColor: editingProject.color,
                }}
              />
            </div>
          </div>

          <div className="border-t border-bg pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-dark">
                Tasks{" "}
                <span className="text-muted font-normal">
                  ({doneCount}/{projectTasks.length} done)
                </span>
              </h4>
              {canManageTasks && (
                <Button
                  variant="secondary"
                  onClick={() => openCreateModalForProject(editingProject.id)}
                >
                  <Plus size={14} className="inline mr-1.5 -mt-0.5" /> Add Task
                </Button>
              )}
            </div>

            {projectTasks.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">
                No tasks yet for this project.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {projectTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => openTaskView(task)}
                    className="w-full flex items-center gap-3 bg-bg rounded-card px-3 py-2 hover:bg-primary-light/40 transition-colors text-left"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2
                        size={16}
                        className="text-success-text shrink-0"
                      />
                    ) : (
                      <Circle size={16} className="text-muted shrink-0" />
                    )}
                    <span className="text-sm text-dark flex-1 truncate">
                      {task.title}
                    </span>
                    {task.status === "done" && task.completedBy && (
                      <span className="text-[11px] text-muted shrink-0">
                        by {task.completedBy}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
