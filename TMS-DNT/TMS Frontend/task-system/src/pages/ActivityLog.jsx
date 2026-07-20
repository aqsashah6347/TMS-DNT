import { useEffect } from "react";
import { useActivityStore } from "../Features/activities/activityStore";
import { connectSocket, getSocket } from "../lib/socket";
import ActionActivityBox from "../Features/activities/components/ActionActivityBox";
import TaskActivityBox from "../Features/activities/components/TaskActivityBox";

export default function ActivityLog() {
  const {
    actionActivities,
    actionLoading,
    fetchActivities,
    fetchActionActivities,
    initSocketListeners,
  } = useActivityStore();

  // Same real-time wiring the old single-list page used: the socket
  // already pushes "new_activity" events scoped to this user's room
  // (and, for self-logged actions, the shared "admins" room too — see
  // tms-backend/src/config/socket.js + activityService.js), so both
  // boxes below update live without a page refresh.
  useEffect(() => {
    if (!getSocket()) connectSocket();
    initSocketListeners();
    fetchActivities();
    fetchActionActivities();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-4xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Activity
        </h2>
        <p className="text-silver-muted text-sm mt-1">
          Task actions and task timelines, in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <ActionActivityBox activities={actionActivities} loading={actionLoading} />
        <TaskActivityBox />
      </div>
    </div>
  );
}