import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useAdminStore } from "../adminStore";

const roleOptions = [
  { value: "user", label: "user" },
  { value: "admin", label: "admin" },
];
const statusOptions = [
  { value: "active", label: "active" },
  { value: "inactive", label: "inactive" },
];

const emptyForm = { name: "", email: "", role: "user", status: "active" };

export default function UserModal() {
  const { isModalOpen, editingUser, closeModal, addUser, updateUser } =
    useAdminStore();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(editingUser ? { ...editingUser } : emptyForm);
  }, [editingUser, isModalOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, form);
    } else {
      addUser(form);
    }
    closeModal();
  }

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={editingUser ? "Edit User" : "Add User"}
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Sara Khan"
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="e.g. sara@example.com"
        />
        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            label="Role"
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v })}
            options={roleOptions}
          />
          <Dropdown
            label="Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={statusOptions}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {editingUser ? "Save Changes" : "Add User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
