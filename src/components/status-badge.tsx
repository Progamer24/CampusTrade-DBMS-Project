type StatusBadgeProps = {
  status: string;
};

function statusClass(status: string) {
  return `status-${status.toLowerCase().replace(/\s+/g, "-")}`;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge ${statusClass(status)}`}>{status}</span>;
}