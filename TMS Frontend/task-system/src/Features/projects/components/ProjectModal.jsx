import { useState, useEffect } from "react";
import { Plus, Pencil, CheckCircle2, Circle } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useProjectStore } from "../projectStore";
import { useTaskStore } from "../../tasks/taskStore";
import { PROJECT_COLORS } from "../../../utils/projectColors";

const statusOptions = ["planning", "active", "completed"].map((v) => ({
  value: v,
  label: v,
}));
const emptyForm = {
  name: "",
  description: "",
  teamName: "",
  status: "planning",
  members: "",
  color: PROJECT_COLORS[0],
};

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
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingProject?.name) {
      setForm({
        ...editingProject,
        members: editingProject.members.join(", "),
      });
    } else {
      setForm({
        ...emptyForm,
        color: editingProject?.color || PROJECT_COLORS[0],
      });
    }
  }, [editingProject, isModalOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      ...form,
      members: form.members
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    };

    if (editingProject?.id) {
      updateProject(editingProject.id, payload);
      useProjectStore.setState({ modalMode: "view" });
    } else {
      addProject(payload);
      closeModal();
    }
  }

  function handleDelete() {
    if (editingProject?.id) deleteProject(editingProject.id);
    closeModal();
  }

  if (!editingProject) return null;

  const isEditing = modalMode === "edit";
  const isNew = !editingProject.id;
  const projectTasks = editingProject.id
    ? getTasksByProject(editingProject.id)
    : [];
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
            <Input
              label="Team name"
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              placeholder="e.g. Frontend Squad"
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

          <div className="flex items-center justify-between pt-2">
            {!isNew ? (
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
                  isNew
                    ? closeModal()
                    : useProjectStore.setState({ modalMode: "view" })
                }
              >
                {isNew ? "Cancel" : "Back"}
              </Button>
              <Button variant="primary" type="submit">
                {isNew ? "Create Project" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
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
              <Button
                variant="secondary"
                onClick={() => openCreateModalForProject(editingProject.id)}
              >
                <Plus size={14} className="inline mr-1.5 -mt-0.5" /> Add Task
              </Button>
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
