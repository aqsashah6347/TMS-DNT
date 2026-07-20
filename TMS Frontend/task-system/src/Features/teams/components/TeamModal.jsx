// src/Features/teams/components/TeamModal.jsx
import { useState, useEffect, useMemo } from "react";
import { Pencil } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useTeamStore } from "../teamStore";
import { useProjectStore } from "../../projects/projectStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { usersApi } from "../../../api/usersApi";
import TeamMemberPicker from "./TeamMemberPicker";
import { TEAM_COLORS, DEFAULT_TEAM_COLOR } from "../../../utils/teamColors";

const emptyForm = {
  name: "",
  description: "",
  managerId: "",
  members: [],
  color: TEAM_COLORS[0],
};

function getInitialForm(team) {
  if (!team) return emptyForm;
  return {
    name: team.name || "",
    description: team.description || "",
    managerId: team.managerId ? String(team.managerId) : "",
    members: (team.memberDetails || [])
      .filter((m) => m.id !== team.managerId)
      .map((m) => m.id),
    color: team.color || emptyForm.color,
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
      color: form.color,
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

    // Editing an existing team drops back to the read-only view instead
    // of closing the modal entirely — mirrors ProjectModal's behavior.
    // Creating a brand new team still closes the modal, since there's
    // no "view" to return to for something that didn't exist yet.
    if (isEditing) {
      useTeamStore.setState({ modalMode: "view" });
    } else {
      closeModal();
    }
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

      <div>
        <label className="text-xs font-medium text-muted mb-1.5 block">
          Team color
        </label>
        <div className="flex gap-2">
          {TEAM_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? "#ffffff" : "transparent",
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
            onClick={() =>
              isEditing
                ? useTeamStore.setState({ modalMode: "view" })
                : closeModal()
            }
            disabled={isSubmitting}
          >
            {isEditing ? "Back" : "Cancel"}
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
    modalMode,
    closeModal,
    addTeam,
    updateTeam,
    deleteTeam,
  } = useTeamStore();
  const allProjects = useProjectStore((s) => s.projects);
  const { user } = useAuthStore();
  const canManageTeam = user?.role === "admin";

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!isModalOpen) return;
    usersApi
      .getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [isModalOpen]);

  const teamProjects = useMemo(
    () =>
      editingTeam?.id
        ? allProjects.filter((p) => p.teamId === editingTeam.id)
        : [],
    [allProjects, editingTeam?.id],
  );

  const isEditing = modalMode === "edit";
  const isNew = isEditing && !editingTeam;

  // Nothing to show a read-only view of yet (e.g. modal just closed).
  if (!isNew && !editingTeam) return null;

  const color = editingTeam?.color || DEFAULT_TEAM_COLOR;
  const members = editingTeam?.memberDetails || [];

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={isNew ? "New Team" : isEditing ? "Edit Team" : editingTeam.name}
      width="max-w-lg"
    >
      {isEditing ? (
        <TeamForm
          key={`${editingTeam?.id ?? "new"}-${isModalOpen}`}
          editingTeam={editingTeam}
          users={users}
          closeModal={closeModal}
          addTeam={addTeam}
          updateTeam={updateTeam}
          deleteTeam={deleteTeam}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Read-only info */}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-muted">
              Manager: {editingTeam.managerName || "Unassigned"}
            </span>
          </div>

          {editingTeam.description && (
            <p className="text-sm text-muted">{editingTeam.description}</p>
          )}

          <div>
            <h4 className="text-sm font-semibold text-dark mb-2">
              Members{" "}
              <span className="text-muted font-normal">
                ({members.length})
              </span>
            </h4>
            {members.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">
                No members yet.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-bg rounded-card px-3 py-1.5"
                  >
                    <span className="text-sm text-dark truncate">
                      {m.name}
                    </span>
                    {m.enrollNo && (
                      <span className="text-[11px] text-muted font-mono shrink-0">
                        #{m.enrollNo}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-bg pt-4">
            <h4 className="text-sm font-semibold text-dark mb-2">
              Projects{" "}
              <span className="text-muted font-normal">
                ({teamProjects.length})
              </span>
            </h4>
            {teamProjects.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">
                No projects for this team yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {teamProjects.map((p) => (
                  <li
                    key={p.id}
                    className="text-sm text-dark bg-bg rounded-card px-3 py-1.5 truncate"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canManageTeam && (
            <div className="flex justify-end pt-2 border-t border-bg">
              <Button
                variant="primary"
                onClick={() => useTeamStore.setState({ modalMode: "edit" })}
              >
                <Pencil size={14} className="inline mr-1.5 -mt-0.5" /> Edit
                Team
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}