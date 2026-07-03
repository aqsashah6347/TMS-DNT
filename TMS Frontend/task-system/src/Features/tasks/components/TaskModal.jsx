import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useTaskStore } from "../taskStore";

const priorityOptions = ["low", "medium", "high", "critical"].map((v) => ({
  value: v,
  label: v,
}));
const statusOptions = ["backlog", "in progress", "review", "done"].map((v) => ({
  value: v,
  label: v,
}));

const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
  status: "backlog",
  dueDate: "",
  assignedTo: "",
};

export default function TaskModal() {
  const {
    isTaskModalOpen,
    editingTask,
    closeTaskModal,
    addTask,
    updateTask,
    deleteTask,
  } = useTaskStore();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(editingTask ? { ...editingTask } : emptyForm);
  }, [editingTask, isTaskModalOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, form);
    } else {
      addTask(form);
    }
    closeTaskModal();
  }

  function handleDelete() {
    if (editingTask) deleteTask(editingTask.id);
    closeTaskModal();
  }

  return (
    <Modal
      isOpen={isTaskModalOpen}
      onClose={closeTaskModal}
      title={editingTask ? "Edit Task" : "New Task"}
    >
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
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <Input
            label="Assigned To"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            placeholder="e.g. Sara"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {editingTask ? (
            <Button variant="danger" type="button" onClick={handleDelete}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={closeTaskModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
