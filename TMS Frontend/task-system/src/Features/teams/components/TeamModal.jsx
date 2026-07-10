import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useTeamStore } from "../teamStore";

const emptyForm = { name: "", members: "" };

export default function TeamModal() {
  const {
    isModalOpen,
    editingTeam,
    closeModal,
    addTeam,
    updateTeam,
    deleteTeam,
  } = useTeamStore();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingTeam) {
      setForm({
        name: editingTeam.name,
        members: editingTeam.members.join(", "),
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingTeam, isModalOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      members: form.members
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      createdBy: editingTeam?.createdBy || "Admin",
    };

    if (editingTeam) {
      updateTeam(editingTeam.id, payload);
    } else {
      addTeam(payload);
    }
    closeModal();
  }

  function handleDelete() {
    if (editingTeam) deleteTeam(editingTeam.id);
    closeModal();
  }

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={editingTeam ? "Edit Team" : "New Team"}
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Team name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Frontend Squad"
        />

        <Input
          label="Members"
          value={form.members}
          onChange={(e) => setForm({ ...form, members: e.target.value })}
          placeholder="Comma-separated, e.g. Aqsa, Sara"
        />

        <div className="flex items-center justify-between pt-2">
          {editingTeam ? (
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
              {editingTeam ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
