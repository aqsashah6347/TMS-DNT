import { Plus } from "lucide-react";
import { useAdminStore } from "../features/admin/adminStore";
import UserTable from "../features/admin/components/UserTable";
import UserModal from "../features/admin/components/UserModal";
import Button from "../components/ui/Button";

export default function Admin() {
  const { openCreateModal } = useAdminStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-white" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          Admin — User Management
        </h2>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={14} className="inline mr-1.5 -mt-0.5" /> Add User
        </Button>
      </div>

      <UserTable />
      <UserModal />
    </div>
  );
}
