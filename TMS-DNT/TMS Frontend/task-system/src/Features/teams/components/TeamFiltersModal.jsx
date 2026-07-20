import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useTeamStore } from "../teamStore";
import { usersApi } from "../../../api/usersApi";

export default function TeamFiltersModal() {
  const {
    isFiltersModalOpen,
    closeFiltersModal,
    filters,
    setFilters,
    clearFilters,
  } = useTeamStore();

  const [managers, setManagers] = useState([]);

  useEffect(() => {
    if (isFiltersModalOpen) {
      usersApi
        .getAllUsers()
        .then((users) =>
          setManagers(
            users.filter((u) => u.role === "manager" || u.role === "admin"),
          ),
        )
        .catch(() => setManagers([]));
    }
  }, [isFiltersModalOpen]);

  const managerOptions = [
    { value: "", label: "Any manager" },
    ...managers.map((m) => ({ value: String(m.id), label: m.name })),
  ];

  return (
    <Modal
      isOpen={isFiltersModalOpen}
      onClose={closeFiltersModal}
      title="Filter Teams"
      width="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <Dropdown
          label="Manager"
          value={filters.managerId}
          onChange={(v) => setFilters({ managerId: v })}
          options={managerOptions}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={clearFilters}>
            Clear all
          </Button>
          <Button variant="primary" onClick={closeFiltersModal}>
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}