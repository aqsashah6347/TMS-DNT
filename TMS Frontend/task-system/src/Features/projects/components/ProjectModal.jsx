import { useState, useEffect, useMemo } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import Modal from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useProjectStore } from "../projectStore";
import { useTaskStore } from "../../tasks/taskStore";
import { usePermissionStore } from "../../../store/usePermissionStore";
import { usersApi } from "../../../api/usersApi";
import { teamApi } from "../../../api/teamApi";
import { taskApi } from "../../../api/taskApi";
import { PROJECT_COLORS } from "../../../utils/projectColors";
import ProjectMemberPicker from "./ProjectMemberPicker";

// Matches the --tvm-accent value hard-coded in .tvm-pv-card (index.css) —
// this used to be the project view card's *fixed* accent regardless of
// the project's own color swatch. Kept as the fallback for projects that
// don't have a color set yet.
const PV_ACCENT = "#d98c3d";

const statusOptions = ["planning", "active", "completed"].map((v) => ({
  value: v,
  label: v,
}));

const emptyForm = {
  name: "",
  description: "",
  teamId: "",
  status: "planning",
  members: [],
  color: PROJECT_COLORS[0],
};

const getInitialForm = (project) => ({
  ...emptyForm,
  name: project?.name || emptyForm.name,
  description: project?.description || emptyForm.description,
  teamId: project?.teamId ? String(project.teamId) : emptyForm.teamId,
  status: project?.status || emptyForm.status,
  members: Array.isArray(project?.memberDetails)
    ? project.memberDetails.map((m) => m.id)
    : emptyForm.members,
  color: project?.color || emptyForm.color,
});

function ProjectForm({
  editingProject,
  users,
  teams,
  teamOptions,
  addProject,
  updateProject,
  deleteProject,
  closeModal,
  taskCount,
}) {
  const [form, setForm] = useState(() => getInitialForm(editingProject));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const can = usePermissionStore((s) => s.can);
  const canDeleteProject = can("projects", "delete");

  const isNew = !editingProject.id;

  const selectedTeam = useMemo(
    () =>
      form.teamId
        ? teams.find((t) => String(t.id) === String(form.teamId))
        : null,
    [teams, form.teamId],
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      description: form.description,
      teamId: form.teamId ? Number(form.teamId) : null,
      status: form.status,
      color: form.color,
      members: form.members,
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
    if (!editingProject?.id) return;

    const warning =
      taskCount > 0
        ? `This project has ${taskCount} task${taskCount === 1 ? "" : "s"}. Deleting it will also delete ${taskCount === 1 ? "that task" : "all of those tasks"}. This can't be undone. Delete anyway?`
        : "Delete this project? This can't be undone.";

    if (!window.confirm(warning)) return;

    await deleteProject(editingProject.id);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <ProjectMemberPicker
        users={selectedTeam?.memberDetails || []}
        selectedIds={form.members}
        onChange={(members) => setForm({ ...form, members })}
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
        {!isNew && canDeleteProject ? (
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
  const { openTaskView, openCreateModalForProject, isTaskModalOpen } =
    useTaskStore();
  const can = usePermissionStore((s) => s.can);
  const canAddTask = can("tasks", "create");
  const canEditProject = can("projects", "edit");

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);

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

  const projectId = editingProject?.id;

  // The project's own color swatch (picked in the edit form) drives every
  // accent in the view card — box borders, check icons, progress bars, and
  // both charts — instead of a fixed orange. Falls back to PV_ACCENT for
  // older projects that don't have a color saved yet.
  const accentColor = editingProject?.color || PV_ACCENT;

  // Pulls this project's tasks straight from the API (filtered server-side
  // by projectId), instead of reading useTaskStore's `tasks` array — that
  // array is whatever page/filter the Tasks list last loaded, which often
  // doesn't include every task for this specific project at all.
  useEffect(() => {
    if (!isModalOpen || !projectId) {
      setProjectTasks([]);
      return;
    }

    let cancelled = false;
    taskApi
      .getAllTasks({ projectId }, 1, 100)
      .then(({ tasks }) => {
        if (!cancelled) setProjectTasks(tasks);
      })
      .catch(() => {
        if (!cancelled) setProjectTasks([]);
      });

    return () => {
      cancelled = true;
    };
    // Re-run whenever the task modal (add/edit task) just closed, too —
    // that's how tasks get created or edited from inside this project view,
    // so this is what makes newly added tasks show up without a full reopen.
  }, [isModalOpen, projectId, isTaskModalOpen]);

  // Groups the task list by assignee for the "Project Tasks" box — each
  // group gets its own done-count and an average-progress bar, on top of
  // the per-task bars underneath it. Every member assigned to the project
  // gets a group, even ones with zero tasks yet, so the full team always
  // shows up here (not just whoever already has work assigned).
  const taskGroups = useMemo(() => {
    const byAssignee = new Map();

    projectTasks.forEach((t) => {
      const key = t.assignedTo != null ? `id:${t.assignedTo}` : "unassigned";
      const name = t.assignedToName || "Unassigned";
      if (!byAssignee.has(key)) byAssignee.set(key, { name, tasks: [] });
      byAssignee.get(key).tasks.push(t);
    });

    (editingProject?.memberDetails || []).forEach((m) => {
      const key = `id:${m.id}`;
      if (!byAssignee.has(key)) {
        byAssignee.set(key, { name: m.name, tasks: [] });
      }
    });

    return Array.from(byAssignee.values()).map(({ name, tasks }) => ({
      name,
      tasks,
      doneCount: tasks.filter((t) => t.status === "done").length,
      avgProgress: tasks.length
        ? Math.round(
            tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length,
          )
        : 0,
    }));
  }, [projectTasks, editingProject?.memberDetails]);

  // Data for the two functional charts that replace the placeholder icons —
  // an overall completion pie, and a per-member progress bar chart, styled
  // the same way as the charts in TaskModal.
  const completionPieData = useMemo(() => {
    const pct = editingProject?.progress || 0;
    return [
      { id: 0, value: pct, label: "Completed", color: accentColor },
      { id: 1, value: 100 - pct, label: "Remaining", color: "#3a3a3a" },
    ];
  }, [editingProject?.progress, accentColor]);

  const memberBarData = useMemo(
    () => taskGroups.map((g) => ({ name: g.name, avgProgress: g.avgProgress })),
    [taskGroups],
  );

  if (!editingProject) return null;

  const teamOptions = [
    { value: "", label: "No team" },
    ...teams.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const createdOnLabel = editingProject.created_at
    ? new Date(editingProject.created_at).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const isEditing = modalMode === "edit";
  const isNew = !editingProject.id;
  const memberCount = (editingProject.memberDetails || []).length;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={
        isNew ? (
          "New Project"
        ) : isEditing ? (
          "Edit Project"
        ) : (
          <span className="tvm-pv-title">{editingProject.name}</span>
        )
      }
      headerRight={
        !isEditing && (
          <div className="tvm-pv-header-right">
            <div className="tvm-pv-header-meta">
              <span>Assigned by: {editingProject.createdByName || "—"}</span>
              <span>Created On: {createdOnLabel}</span>
            </div>
            <div className="tvm-pv-header-divider" />
            {canEditProject && (
              <button
                className="tvm-pv-edit tvm-pv-edit--header"
                onClick={() => useProjectStore.setState({ modalMode: "edit" })}
              >
                Edit
              </button>
            )}
          </div>
        )
      }
      width={isEditing ? "max-w-2xl" : "max-w-[90rem]"}
    >
      {isEditing ? (
        <ProjectForm
          key={`${editingProject.id ?? "new"}-${isModalOpen}`}
          editingProject={editingProject}
          users={users}
          teams={teams}
          teamOptions={teamOptions}
          addProject={addProject}
          updateProject={updateProject}
          deleteProject={deleteProject}
          closeModal={closeModal}
          taskCount={projectTasks.length}
        />
      ) : (
        <div className="tvm-pv-card" style={{ "--tvm-accent": accentColor }}>
          {/* Description left, status dot right */}
          <div className="tvm-pv-status-row">
            <p className="tvm-pv-desc">
              <span className="tvm-pv-desc-label">Description: </span>
              {editingProject.description || "No description yet."}
            </p>
            <div className="tvm-pv-status">
              <span
                className={`tvm-pv-dot tvm-pv-dot--${editingProject.status}`}
              />
              Status: {editingProject.status[0].toUpperCase()}
              {editingProject.status.slice(1)}
            </div>
          </div>

          {/* Project Tasks box (left) + Team Assigned box + pie/bar icons
              + Edit button (right) */}
          <div className="tvm-pv-grid">
            <div className="tvm-pv-box tvm-pv-tasks">
              <div className="tvm-pv-tasks-header">
                <span className="tvm-pv-box-title">Project Tasks:</span>
                <div className="tvm-pv-bar">
                  <div
                    className="tvm-pv-bar-fill"
                    style={{ width: `${editingProject.progress || 0}%` }}
                  />
                </div>
                <span className="tvm-pv-pct">
                  {editingProject.progress || 0}%
                </span>
                {canAddTask && (
                  <button
                    className="tvm-pv-add-task"
                    onClick={() => openCreateModalForProject(editingProject.id)}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              {taskGroups.length === 0 ? (
                <p className="text-xs text-white/40 italic text-center py-6">
                  No tasks yet for this project.
                </p>
              ) : (
                taskGroups.map((group) => (
                  <div className="tvm-pv-group" key={group.name}>
                    <div className="tvm-pv-group-header">
                      <span className="tvm-pv-group-name">
                        {group.name}{" "}
                        <span className="tvm-pv-group-count">
                          ({group.doneCount}/{group.tasks.length})
                        </span>
                      </span>
                      <div className="tvm-pv-bar">
                        <div
                          className="tvm-pv-bar-fill"
                          style={{ width: `${group.avgProgress}%` }}
                        />
                      </div>
                      <span className="tvm-pv-pct">{group.avgProgress}%</span>
                    </div>

                    {group.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => openTaskView(task)}
                        className="tvm-pv-task"
                      >
                        <CheckCircle2
                          size={16}
                          className={`tvm-pv-check ${
                            task.status === "done" ? "tvm-pv-check--done" : ""
                          }`}
                        />
                        <span className="tvm-pv-task-title">
                          Task: {task.title}
                        </span>
                        <div className="tvm-pv-bar">
                          <div
                            className="tvm-pv-bar-fill"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="tvm-pv-pct">
                          {task.progress || 0}%
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="tvm-pv-right">
              <div className="tvm-pv-box tvm-pv-team">
                <span className="tvm-pv-box-title">Team Assigned:</span>
                {memberCount > 0 ? (
                  <ul className="tvm-pv-team-list">
                    {editingProject.memberDetails.map((m) => (
                      <li key={m.id}>{m.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="tvm-pv-desc-empty">No members assigned yet.</p>
                )}
              </div>

              <div className="tvm-pv-charts">
                <div className="tvm-pv-chart-wrap">
                  <PieChart
                    series={[
                      {
                        data: completionPieData,
                        innerRadius: 46,
                        outerRadius: 92,
                        paddingAngle: 2,
                      },
                    ]}
                    width={300}
                    height={260}
                    slotProps={{ legend: { hidden: true } }}
                  />
                  <p className="tvm-pv-chart-caption">
                    {editingProject.progress || 0}% Complete
                  </p>
                </div>

                <div className="tvm-pv-chart-wrap">
                  <BarChart
                    dataset={memberBarData}
                    grid={{ horizontal: true }}
                    colors={[accentColor]}
                    xAxis={[
                      {
                        dataKey: "name",
                        scaleType: "band",
                        tickLabelPlacement: "middle",
                        valueFormatter: (v) =>
                          v.length > 10 ? `${v.slice(0, 10)}…` : v,
                      },
                    ]}
                    yAxis={[{ min: 0, max: 100, width: 34 }]}
                    series={[
                      {
                        dataKey: "avgProgress",
                        label: "Progress",
                        color: accentColor,
                        valueFormatter: (v) => `${v}%`,
                      },
                    ]}
                    width={300}
                    height={260}
                    margin={{ left: 34, right: 12, top: 12, bottom: 36 }}
                    slotProps={{ legend: { hidden: true } }}
                    sx={{
                      "& .MuiBarElement-root": { fill: accentColor },
                      "& .MuiChartsAxis-tickLabel": {
                        fill: "#9ca3af",
                        fontSize: 11,
                      },
                      "& .MuiChartsAxis-line": {
                        stroke: "rgba(255,255,255,0.45)",
                        strokeWidth: 1.5,
                      },
                      "& .MuiChartsGrid-line": {
                        stroke: "rgba(255,255,255,0.1)",
                      },
                      "& .MuiChartsAxis-tick": {
                        stroke: "rgba(255,255,255,0.45)",
                      },
                    }}
                  />
                  <p className="tvm-pv-chart-caption">Team Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
