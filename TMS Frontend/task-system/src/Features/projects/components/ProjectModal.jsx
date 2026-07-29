import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  CheckCircle2,
  Circle,
  Folder,
  Users,
  ListChecks,
  User,
} from "lucide-react";
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
import { PROJECT_COLORS } from "../../../utils/projectColors";
import ProjectMemberPicker from "./ProjectMemberPicker";
import ProjectMembers from "./ProjectMembers";

// Same idea as TaskModal's statusBadgeMap, but for a project's own
// planning/active/completed lifecycle instead of a task's.
const projectStatusBadgeMap = {
  planning: "glass-badge--primary",
  active: "glass-badge--violet",
  completed: "glass-badge--rose",
};

// Hex fills for the task-status pie chart in view mode — kept visually in
// step with the glass-badge colors used elsewhere for the same statuses.
const statusColorHex = {
  backlog: "#8ea8d0",
  "in progress": "#b490f5",
  review: "#ffd27f",
  done: "#4ade80",
};

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

  // Full team record (with memberDetails) for whichever team is currently
  // selected in the dropdown — used to show that team's roster right
  // below it, so picking a team shows who's actually in it.
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
  const { getTasksByProject, openTaskView, openCreateModalForProject } =
    useTaskStore();
  const can = usePermissionStore((s) => s.can);
  const canAddTask = can("tasks", "create");
  const canEditProject = can("projects", "edit");

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

  const projectTasks = editingProject?.id
    ? getTasksByProject(editingProject.id)
    : [];
  const doneCount = projectTasks.filter((t) => t.status === "done").length;

  // Real task-status split, driving the pie chart below — recomputed
  // straight from the live task list every render, so the chart always
  // matches what's actually sitting in the Tasks list underneath it.
  const statusCounts = useMemo(() => {
    const counts = { backlog: 0, "in progress": 0, review: 0, done: 0 };
    projectTasks.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status] += 1;
    });
    return counts;
  }, [projectTasks]);

  // Same idea for priority — drives the bar chart.
  const priorityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    projectTasks.forEach((t) => {
      if (counts[t.priority] !== undefined) counts[t.priority] += 1;
    });
    return counts;
  }, [projectTasks]);

  if (!editingProject) return null;

  const teamOptions = [
    { value: "", label: "No team" },
    ...teams.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const isEditing = modalMode === "edit";
  const isNew = !editingProject.id;
  const accentColor = editingProject.color || "#fb923c";
  const memberCount = (editingProject.memberDetails || []).length;

  const pieData = Object.entries(statusCounts)
    .filter(([, value]) => value > 0)
    .map(([status, value], i) => ({
      id: i,
      value,
      label: status,
      color: statusColorHex[status],
    }));

  const priorityChartData = [
    { priority: "critical", count: priorityCounts.critical },
    { priority: "high", count: priorityCounts.high },
    { priority: "medium", count: priorityCounts.medium },
    { priority: "low", count: priorityCounts.low },
  ];

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={
        isNew ? "New Project" : isEditing ? "Edit Project" : editingProject.name
      }
      // View mode gets the big, wide layout the two-column chart/task
      // spread needs; the edit form keeps its original, tighter width.
      width={isEditing ? "max-w-2xl" : "max-w-6xl"}
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
        <div className="tvm-body">
          {/* Team + status, right under the modal's own title bar —
              same slot TaskModal uses for project name + pin. */}
          <div className="tvm-top-row">
            <span className="tvm-project-name">
              <Folder size={13} className="tvm-project-icon" />
              {editingProject.teamName || "No team"}
            </span>
            <span
              className={`glass-badge ${
                projectStatusBadgeMap[editingProject.status] ||
                "glass-badge--primary"
              } tvm-pill`}
            >
              {editingProject.status}
            </span>
          </div>

          <div className="tvm-divider" />

          {/* Wide two-column layout so the big rectangular modal actually
              gets used instead of leaving one long narrow column. */}
          <div className="grid grid-cols-[1.3fr_1fr] gap-10">
            {/* Left column — description, meta, task list */}
            <div className="flex flex-col">
              <p className="tvm-label">Description:</p>
              {editingProject.description ? (
                <p className="tvm-desc-text">{editingProject.description}</p>
              ) : (
                <p className="tvm-desc-text tvm-desc-empty">
                  No description yet.
                </p>
              )}

              <div className="tvm-meta-row">
                <span className="tvm-meta-item">
                  <Users size={13} /> {memberCount} member
                  {memberCount === 1 ? "" : "s"}
                </span>
                <span className="tvm-meta-item">
                  <ListChecks size={13} /> {projectTasks.length} task
                  {projectTasks.length === 1 ? "" : "s"}
                </span>
                {editingProject.createdByName && (
                  <span className="tvm-meta-item">
                    <User size={13} /> Created by {editingProject.createdByName}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 20 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="tvm-label" style={{ margin: 0 }}>
                    Tasks{" "}
                    <span style={{ color: "#6b7280" }}>
                      ({doneCount}/{projectTasks.length} done)
                    </span>
                  </p>
                  {canAddTask && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        openCreateModalForProject(editingProject.id)
                      }
                    >
                      <Plus size={14} className="inline mr-1.5 -mt-0.5" /> Add
                      Task
                    </Button>
                  )}
                </div>

                {projectTasks.length === 0 ? (
                  <p className="text-xs text-white/40 italic text-center py-4">
                    No tasks yet for this project.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {projectTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => openTaskView(task)}
                        className="glass-row w-full text-left"
                      >
                        {task.status === "done" ? (
                          <CheckCircle2
                            size={16}
                            className="text-success-text shrink-0"
                          />
                        ) : (
                          <Circle
                            size={16}
                            className="shrink-0"
                            style={{ color: "#9ca3af" }}
                          />
                        )}
                        <span className="text-sm flex-1 truncate">
                          {task.title}
                        </span>
                        {task.status === "done" && task.completedBy && (
                          <span
                            className="text-[11px] shrink-0"
                            style={{ color: "#9ca3af" }}
                          >
                            by {task.completedBy}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column — members, progress, charts */}
            <div className="flex flex-col">
              <p className="tvm-label">Members:</p>
              {memberCount > 0 ? (
                <ProjectMembers
                  members={editingProject.memberDetails}
                  max={8}
                />
              ) : (
                <p className="tvm-desc-text tvm-desc-empty">
                  No members assigned yet.
                </p>
              )}

              <div className="tvm-progress-block">
                <p className="tvm-label">Project Progress:</p>
                <div className="tvm-progress-row">
                  <div
                    className="mask-progress-bar"
                    style={{
                      flex: 1,
                      backgroundImage: `linear-gradient(${accentColor}, ${accentColor})`,
                      backgroundSize: `${editingProject.progress || 0}% 100%`,
                    }}
                  />
                  <div className="tvm-progress-value">
                    {editingProject.progress || 0}%
                  </div>
                </div>
              </div>

              <div className="tvm-charts-row">
                <div className="tvm-chart-box">
                  <p className="tvm-label" style={{ textAlign: "center" }}>
                    By status
                  </p>
                  {pieData.length > 0 ? (
                    <PieChart
                      series={[
                        { data: pieData, innerRadius: 0, outerRadius: 40 },
                      ]}
                      width={140}
                      height={120}
                      slotProps={{ legend: { hidden: true } }}
                    />
                  ) : (
                    <p className="text-xs text-white/40 italic py-8 text-center">
                      No tasks yet.
                    </p>
                  )}
                </div>
                <div className="tvm-chart-box tvm-chart-bar">
                  <p className="tvm-label" style={{ textAlign: "center" }}>
                    By priority
                  </p>
                  {projectTasks.length > 0 ? (
                    <BarChart
                      dataset={priorityChartData}
                      colors={[accentColor]}
                      xAxis={[
                        {
                          dataKey: "priority",
                          scaleType: "band",
                          tickLabelPlacement: "middle",
                        },
                      ]}
                      yAxis={[{ width: 24 }]}
                      series={[
                        {
                          dataKey: "count",
                          label: "Tasks",
                          color: accentColor,
                        },
                      ]}
                      height={140}
                      margin={{ left: 24, right: 8, top: 8, bottom: 24 }}
                      slotProps={{ legend: { hidden: true } }}
                      sx={{
                        "& .MuiBarElement-root": { fill: accentColor },
                        "& .MuiChartsAxis-tickLabel": {
                          fill: "#9ca3af",
                          fontSize: 10,
                        },
                        "& .MuiChartsAxis-line": {
                          stroke: "rgba(255,255,255,0.45)",
                          strokeWidth: 1.5,
                        },
                        "& .MuiChartsAxis-tick": {
                          stroke: "rgba(255,255,255,0.45)",
                        },
                      }}
                    />
                  ) : (
                    <p className="text-xs text-white/40 italic py-8 text-center">
                      No tasks yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="tvm-divider" />

          {/* Footer — Edit lives here, matching TaskModal's footer slot. */}
          <div className="tvm-footer">
            <span />
            {canEditProject ? (
              <button
                className="tvm-btn-edit"
                onClick={() => useProjectStore.setState({ modalMode: "edit" })}
              >
                <Pencil size={14} className="tvm-pill-icon" /> Edit Project
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
