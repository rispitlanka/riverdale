export function formatCurrency(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "CA$0.00";

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateInput: string | number | Date): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "under_review":
      return "bg-yellow-100 text-yellow-800";
    case "quoted":
      return "bg-purple-100 text-purple-800";
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "in_process":
      return "bg-indigo-100 text-indigo-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "quoted":
      return "Quoted";
    case "confirmed":
      return "Confirmed";
    case "in_process":
      return "In Process";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

// Utility to merge Tailwind / className strings
export function cn(...inputs: Array<string | number | null | undefined | false>): string {
  return inputs.filter(Boolean).join(" ");
}


