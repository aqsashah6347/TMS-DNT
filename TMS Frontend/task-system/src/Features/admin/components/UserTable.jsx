import { Pencil, Trash2 } from "lucide-react";
import { useAdminStore } from "../adminStore";

const roleBadge = {
  admin: "glass-badge--primary",
  user: "glass-badge--violet",
};
const statusColor = { active: "text-emerald-300", inactive: "text-white/40" };

export default function UserTable() {
  const { users, openEditModal, deleteUser } = useAdminStore();

  return (
    <div className="glass glass-table-wrap">
      <div className="glass-content">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="text-white font-medium">{user.name}</td>
                <td className="text-white/50">{user.email}</td>
                <td>
                  <span className={`glass-badge ${roleBadge[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`text-xs font-medium capitalize ${statusColor[user.status]}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-white/40 hover:text-white p-1"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-white/40 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
