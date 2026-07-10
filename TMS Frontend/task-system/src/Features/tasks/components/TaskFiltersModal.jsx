import Modal from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Dropdown } from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";
import { useTaskStore } from "../taskStore";

const priorityOptions = [
  { value: "", label: "All priorities" },
  ...["low", "medium", "high", "critical"].map((v) => ({ value: v, label: v })),
];

export default function TaskFiltersModal() {
  const { isFiltersModalOpen, closeFiltersModal, filters, setFilters } =
    useTaskStore();

  return (
    <Modal
      isOpen={isFiltersModalOpen}
      onClose={closeFiltersModal}
      title="Filter Tasks"
      width="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Task name"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Search by title..."
        />

        <Dropdown
          label="Priority"
          value={filters.priority}
          onChange={(v) => setFilters({ priority: v })}
          options={priorityOptions}
        />

        <Input
          label="Assigned to"
          value={filters.assignedTo}
          onChange={(e) => setFilters({ assignedTo: e.target.value })}
          placeholder="e.g. Sara"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() =>
              setFilters({ priority: "", assignedTo: "", search: "" })
            }
          >
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
