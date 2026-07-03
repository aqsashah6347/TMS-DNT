import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useProjectStore } from "../projectStore";

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
};

export default function ProjectModal() {
  const {
    isModalOpen,
    editingProject,
    closeModal,
    addProject,
    updateProject,
    deleteProject,
  } = useProjectStore();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingProject) {
      setForm({
        ...editingProject,
        members: editingProject.members.join(", "),
      });
    } else {
      setForm(emptyForm);
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

    if (editingProject) {
      updateProject(editingProject.id, payload);
    } else {
      addProject(payload);
    }
    closeModal();
  }

  function handleDelete() {
    if (editingProject) deleteProject(editingProject.id);
    closeModal();
  }

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={editingProject ? "Edit Project" : "New Project"}
    >
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

        <div className="flex items-center justify-between pt-2">
          {editingProject ? (
            <Button variant="danger" type="button" onClick={handleDelete}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingProject ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
