import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useProjectStore } from "../projectStore";
import { teamApi } from "../../../api/teamApi";

const statusOptions = [
  { value: "", label: "All statuses" },
  ...["planning", "active", "completed"].map((v) => ({ value: v, label: v })),
];

export default function ProjectFiltersModal() {
  const {
    isFiltersModalOpen,
    closeFiltersModal,
    filters,
    setFilters,
    clearFilters,
  } = useProjectStore();

  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (isFiltersModalOpen) {
      // "user" role can't call getAllTeams (admin/manager only on the
      // backend) — fall back to an empty list instead of the request
      // 403ing and leaving the modal stuck.
      teamApi
        .getAllTeams()
        .then(setTeams)
        .catch(() => setTeams([]));
    }
  }, [isFiltersModalOpen]);

  const teamOptions = [
    { value: "", label: "Any team" },
    ...teams.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  return (
    <Modal
      isOpen={isFiltersModalOpen}
      onClose={closeFiltersModal}
      title="Filter Projects"
      width="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <Dropdown
          label="Status"
          value={filters.status}
          onChange={(v) => setFilters({ status: v })}
          options={statusOptions}
        />

        <Dropdown
          label="Team"
          value={filters.teamId}
          onChange={(v) => setFilters({ teamId: v })}
          options={teamOptions}
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