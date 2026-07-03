import { Pencil, Trash2 } from "lucide-react";
import { useAdminStore } from "../adminStore";
import Card from "../../../components/ui/Card";

const roleStyles = {
  admin: "bg-primary text-dark",
  user: "bg-primary-light text-dark",
};

const statusStyles = {
  active: "bg-success text-success-text",
  inactive: "bg-bg text-muted",
};

export default function UserTable() {
  const { users, openEditModal, deleteUser } = useAdminStore();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-primary-light text-left text-xs text-muted">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-bg last:border-0">
              <td className="px-4 py-3 text-dark font-medium">{user.name}</td>
              <td className="px-4 py-3 text-muted">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${roleStyles[user.role]}`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusStyles[user.status]}`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-muted hover:text-dark p-1"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-muted hover:text-danger-text p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
