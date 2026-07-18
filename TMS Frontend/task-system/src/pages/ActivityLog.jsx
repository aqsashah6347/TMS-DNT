import { useEffect } from "react";
import { useActivityStore } from "../Features/activities/activityStore";
import { connectSocket, getSocket } from "../lib/socket";
import ActionActivityBox from "../Features/activities/components/ActionActivityBox";
import TaskActivityBox from "../Features/activities/components/TaskActivityBox";
import InboxNotificationsBox from "../Features/activities/components/InboxNotificationsBox";

export default function ActivityLog() {
  const {
    activities,
    loading,
    actionActivities,
    actionLoading,
    unreadCount,
    fetchActivities,
    fetchActionActivities,
    markAsRead,
    markAllAsRead,
    initSocketListeners,
  } = useActivityStore();

  // Same real-time wiring the old single-list page used: the socket
  // already pushes "new_activity" events scoped to this user's room
  // (and, for self-logged actions, the shared "admins" room too — see
  // tms-backend/src/config/socket.js + activityService.js), so all
  // three boxes below update live without a page refresh.
  useEffect(() => {
    if (!getSocket()) connectSocket();
    initSocketListeners();
    fetchActivities();
    fetchActionActivities();
  }, []);

  return (
    <div>
      <div className="section-glass-header mb-6">
        <div>
          <h2 className="section-glass-header__title !text-3xl">Activity</h2>
          <p className="text-silver-muted text-sm mt-1">
            Task actions, task timelines, and real-time notifications in one
            place.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left — big box */}
        <div>
          <ActionActivityBox
            activities={actionActivities}
            loading={actionLoading}
          />
        </div>

        {/* Right — stacked boxes */}
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <TaskActivityBox />
          </div>
          <div className="flex-1">
            <InboxNotificationsBox
              activities={activities}
              unreadCount={unreadCount}
              loading={loading}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
          </div>
        </div>
      </div>
    </div>
  );
}