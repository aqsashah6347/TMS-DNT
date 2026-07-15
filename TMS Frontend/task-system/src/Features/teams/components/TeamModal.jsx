// src/Features/teams/components/TeamModal.jsx
import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useTeamStore } from "../teamStore";
import { usersApi } from "../../../api/usersApi";
import TeamMemberPicker from "./TeamMemberPicker";

const emptyForm = { name: "", description: "", managerId: "", members: [] };

function getInitialForm(team) {
  if (!team) return emptyForm;
  return {
    name: team.name || "",
    description: team.description || "",
    managerId: team.managerId ? String(team.managerId) : "",
    members: (team.memberDetails || [])
      .filter((m) => m.id !== team.managerId)
      .map((m) => m.id),
  };
}

// Split out from TeamModal and mounted with a `key` tied to
// editingTeam.id so switching teams (or opening "New Team") remounts
// this component with a fresh initial form instead of needing a
// useEffect to call setForm — calling setState synchronously inside an
// effect just to sync props into state triggers React's "cascading
// render" warning, and a key-based remount sidesteps it entirely
// (same pattern ProjectModal.jsx already uses for ProjectForm).
function TeamForm({
  editingTeam,
  users,
  closeModal,
  addTeam,
  updateTeam,
  deleteTeam,
}) {
  const [form, setForm] = useState(() => getInitialForm(editingTeam));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const isEditing = Boolean(editingTeam);
  const managerOptions = [
    { value: "", label: "No manager yet" },
    ...users.map((u) => ({
      value: String(u.id),
      label: `${u.name} (${u.role})`,
    })),
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      description: form.description,
      managerId: form.managerId ? Number(form.managerId) : null,
      members: form.members,
    };

    setFormError(null);
    setIsSubmitting(true);

    const ok = isEditing
      ? await updateTeam(editingTeam.id, payload)
      : await addTeam(payload);

    setIsSubmitting(false);

    if (!ok) {
      setFormError(useTeamStore.getState().error);
      return;
    }

    closeModal();
  }

  async function handleDelete() {
    if (!editingTeam) return;
    if (!window.confirm(`Delete "${editingTeam.name}"? This can't be undone.`))
      return;

    await deleteTeam(editingTeam.id);
    closeModal();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Team name"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Frontend Squad"
      />

      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Optional details..."
      />

      <Dropdown
        label="Team manager"
        value={form.managerId}
        onChange={(v) => setForm({ ...form, managerId: v })}
        options={managerOptions}
      />

      <TeamMemberPicker
        selectedIds={form.members}
        onChange={(members) => setForm({ ...form, members })}
      />

      {formError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        {isEditing ? (
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
            onClick={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : isEditing
                ? "Save Changes"
                : "Create Team"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function TeamModal() {
  const {
    isModalOpen,
    editingTeam,
    closeModal,
    addTeam,
    updateTeam,
    deleteTeam,
  } = useTeamStore();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!isModalOpen) return;
    usersApi
      .getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [isModalOpen]);

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={editingTeam ? "Edit Team" : "New Team"}
      width="max-w-lg"
    >
      <TeamForm
        key={`${editingTeam?.id ?? "new"}-${isModalOpen}`}
        editingTeam={editingTeam}
        users={users}
        closeModal={closeModal}
        addTeam={addTeam}
        updateTeam={updateTeam}
        deleteTeam={deleteTeam}
      />
    </Modal>
  );
}
