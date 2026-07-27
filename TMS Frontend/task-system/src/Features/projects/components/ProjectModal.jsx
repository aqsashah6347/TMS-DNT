import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, CheckCircle2, Circle } from "lucide-react";
<<<<<<< HEAD
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
=======
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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
<<<<<<< HEAD
import {
  getTaskProgress,
  setTaskProgress,
  getProductivityByDate,
} from "../../../utils/taskProgress";
import ProjectMemberPicker from "./ProjectMemberPicker";

const PIE_COLORS = ["#f97316", "#3f3f46"];

const statusOptions = ["planning", "active", "completed"].map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

=======
import ProjectMemberPicker from "./ProjectMemberPicker";

const statusOptions = ["planning", "active", "completed"].map((v) => ({
  value: v,
  label: v,
}));
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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

  const isNew = !editingProject.id;

<<<<<<< HEAD
=======
  // Full team record (with memberDetails) for whichever team is currently
  // selected in the dropdown — used to show that team's roster right
  // below it, so picking a team shows who's actually in it.
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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
<<<<<<< HEAD
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-black p-4 rounded-xl text-orange-500">
=======
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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
<<<<<<< HEAD
        <label className="text-xs font-medium text-orange-400 mb-1.5 block">
=======
        <label className="text-xs font-medium text-muted mb-1.5 block">
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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
<<<<<<< HEAD
                borderColor: form.color === c ? "#f97316" : "transparent",
=======
                borderColor: form.color === c ? "#001021" : "transparent",
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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
<<<<<<< HEAD
  // eslint-disable-next-line no-unused-vars -- value itself is unused, it only exists to force a re-render/re-read of localStorage
  const [progressVersion, setProgressVersion] = useState(0);
=======
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc

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
  const projectTasks = editingProject.id
    ? getTasksByProject(editingProject.id)
    : [];
  const doneCount = projectTasks.filter((t) => t.status === "done").length;
<<<<<<< HEAD
  const pendingCount = Math.max(projectTasks.length - doneCount, 0);

  const currentTeam = teams.find(
    (t) => String(t.id) === String(editingProject.teamId)
  );

  // Re-read from localStorage on every render; changing a task's progress
  // bumps progressVersion, which triggers this re-render and re-read.
  const productivityData = getProductivityByDate(
    projectTasks.map((t) => t.id)
  );

  const completionData = [
    { name: "Completed", value: doneCount },
    { name: "Pending", value: pendingCount },
  ];
  const hasTasks = projectTasks.length > 0;
  const completionPct = hasTasks
    ? Math.round((doneCount / projectTasks.length) * 100)
    : 0;

  function handleProgressChange(taskId, value) {
    setTaskProgress(taskId, value);
    setProgressVersion((v) => v + 1);
  }
=======
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
<<<<<<< HEAD
      title=""
      width="max-w-6xl"
      style={{ maxWidth: "60rem" }}
=======
      title={
        isNew ? "New Project" : isEditing ? "Edit Project" : editingProject.name
      }
      width="max-w-2xl"
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
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
<<<<<<< HEAD
        <div className="flex flex-col gap-6 bg-black p-6 rounded-2xl text-orange-500 border border-orange-500/30">
          
          {/* Top Header */}
          <div className="flex justify-between items-center border-b border-orange-500/20 pb-4">
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: editingProject.color || "#f97316" }}
              />
              <h2 className="text-xl font-bold tracking-wide uppercase text-orange-500">
                {editingProject.name}
              </h2>
            </div>
            <div className="text-right text-xs text-orange-400/80 border-l border-orange-500/20 pl-4">
              <p>Assigned by: <span className="text-orange-500 font-medium">{editingProject.assignedBy || "Name Name"}</span></p>
              <p>Created On: <span className="text-orange-500 font-medium">{editingProject.createdAt ? new Date(editingProject.createdAt).toLocaleDateString() : "xx-yy-zzzz"}</span></p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left 2 Columns */}
            <div className="md:col-span-2 flex flex-col gap-5 border border-orange-500/30 p-4 rounded-xl bg-black">
              {editingProject.description && (
                <p className="text-sm text-orange-400/90">
                  <strong className="text-orange-500">Description:</strong> {editingProject.description}
                </p>
              )}

              {/* Progress */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-orange-400">
                  <span>Project Tasks:</span>
                  <span>{editingProject.progress || 0}%</span>
                </div>
                <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-orange-500/20">
                  <div
                    className="h-full rounded-full transition-all bg-orange-500"
                    style={{
                      width: `${editingProject.progress || 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Task Breakdown */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                    Task Breakdown ({doneCount}/{projectTasks.length} done)
                  </h4>
                  {canManageTasks && (
                    <Button
                      variant="secondary"
                      className="text-xs py-1 px-3 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 rounded-full"
                      onClick={() => openCreateModalForProject(editingProject.id)}
                    >
                      <Plus size={14} className="inline mr-1 -mt-0.5" /> Add Task
                    </Button>
                  )}
                </div>

                {projectTasks.length === 0 ? (
                  <p className="text-xs text-orange-400/60 text-center py-4">
                    No tasks yet for this project.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {projectTasks.map((task) => {
                      const todayProgress = getTaskProgress(task.id);
                      return (
                        <div
                          key={task.id}
                          className="w-full bg-stone-950 border border-orange-500/20 rounded-lg px-3 py-2.5 hover:border-orange-500/60 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => openTaskView(task)}
                            className="w-full flex items-center gap-2.5 text-left mb-2"
                          >
                            {task.status === "done" ? (
                              <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                            ) : (
                              <Circle size={16} className="text-orange-400/50 shrink-0" />
                            )}
                            <span className="text-sm text-orange-300 truncate">
                              <strong className="text-orange-500">Task:</strong> {task.title}
                            </span>
                          </button>

                          <div className="flex items-center gap-2 pl-[26px]">
                            <div className="flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-orange-500/10">
                              <div
                                className="h-full rounded-full bg-orange-500 transition-all"
                                style={{ width: `${todayProgress}%` }}
                              />
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={5}
                              value={todayProgress}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleProgressChange(task.id, e.target.value)
                              }
                              className="w-14 shrink-0 bg-stone-900 border border-orange-500/30 rounded-md px-1.5 py-0.5 text-xs text-orange-300 font-mono text-right focus:outline-none focus:border-orange-500"
                              aria-label={`Today's progress for ${task.title}`}
                            />
                            <span className="text-xs text-orange-500 font-mono shrink-0">%</span>
                          </div>
                          <p className="text-[10px] text-orange-400/50 pl-[26px] mt-1">
                            Today's progress — updates the charts on the right
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Column */}
            <div className="flex flex-col gap-4">
              
              {/* Status */}
              <div className="flex items-center gap-2 text-xs text-orange-400 font-medium bg-black border border-orange-500/30 px-3 py-3 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-sm shadow-orange-500/50" />
                <span>Status: <strong className="capitalize text-orange-500">{editingProject.status || "Planning"}</strong></span>
              </div>

              {/* Team Assigned */}
              <div className="flex flex-col gap-2 bg-black border border-orange-500/30 p-3.5 rounded-xl">
                <h5 className="text-xs font-semibold text-orange-500 uppercase tracking-wider border-b border-orange-500/20 pb-1.5">
                  Team Assigned:
                </h5>
                <ul className="flex flex-col gap-1.5 text-xs text-orange-400/90 max-h-36 overflow-y-auto">
                  {currentTeam?.memberDetails && currentTeam.memberDetails.length > 0 ? (
                    currentTeam.memberDetails.map((member) => (
                      <li key={member.id} className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {member.name || member.email}
                      </li>
                    ))
                  ) : editingProject.memberDetails && editingProject.memberDetails.length > 0 ? (
                    editingProject.memberDetails.map((member) => (
                      <li key={member.id || member} className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {typeof member === 'object' ? member.name : member}
                      </li>
                    ))
                  ) : (
                    <li className="text-orange-400/50 italic text-[11px]">No members assigned</li>
                  )}
                </ul>
              </div>

              {/* Completion Rate (Pie) */}
              <div className="bg-black border border-orange-500/30 p-3.5 rounded-xl">
                <h5 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">
                  Completion Rate
                </h5>
                {hasTasks ? (
                  <div className="relative h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={completionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={55}
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        >
                          {completionData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#000",
                            border: "1px solid rgba(249,115,22,0.4)",
                            borderRadius: "8px",
                            fontSize: "11px", 
                            color: "#fdba74",
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-orange-500">
                        {completionPct}%
                      </span>
                      <span className="text-[10px] text-orange-400/70">
                        {doneCount}/{projectTasks.length} done
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-orange-400/50 text-center py-8">
                    No tasks to chart yet.
                  </p>
                )}
              </div>

              {/* Productivity by Date (Bar) */}
              <div className="bg-black border border-orange-500/30 p-3.5 rounded-xl">
                <h5 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">
                  Productivity by Date
                </h5>
                {productivityData.length > 0 ? (
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productivityData}
                        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                        barCategoryGap="35%"
                      >
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#fb923c" }}
                          axisLine={{ stroke: "rgba(249,115,22,0.2)" }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "#fb923c" }}
                          axisLine={{ stroke: "rgba(249,115,22,0.2)" }}
                          tickLine={false}
                          width={28}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(249,115,22,0.08)" }}
                          contentStyle={{
                            backgroundColor: "#000",
                            border: "1px solid rgba(249,115,22,0.4)",
                            borderRadius: "8px",
                            fontSize: "11px",
                            color: "#fdba74",
                          }}
                        />
                        <Bar
                          dataKey="productivity"
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-orange-400/50 text-center py-8">
                    Log progress on a task to see productivity by date.
                  </p>
                )}
              </div>

              {/* Edit Button (Separate Box) */}
              <div>
                <Button
                  variant="primary"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-black font-bold py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  onClick={() => useProjectStore.setState({ modalMode: "edit" })}
                >
                  <Pencil size={15} /> Edit
                </Button>
              </div>

            </div>

          </div>

=======
        <div className="flex flex-col gap-5">
          {/* Read-only info — no Edit button up here anymore, it now
              lives at the bottom of the modal instead. */}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: editingProject.color }}
            />
            <span className="text-sm text-muted">
              {editingProject.teamName}
            </span>
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

          {/* Edit button now lives at the bottom of the modal, matching
              the footer position used by the edit form's action buttons. */}
          <div className="flex justify-end pt-2 border-t border-bg">
            <Button
              variant="primary"
              onClick={() => useProjectStore.setState({ modalMode: "edit" })}
            >
              <Pencil size={14} className="inline mr-1.5 -mt-0.5" /> Edit Project
            </Button>
          </div>
>>>>>>> 2d756372ed8b89d5a594bec420b9388e7b28e8cc
        </div>
      )}
    </Modal>
  );
}