import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/shared/lib/format-currency";
import { formatDateTime } from "@/shared/lib/format-date-time";
import { type EntityConfig } from "@/components/entity/types";
import {
  createStaff,
  createStaffSalaryLog,
  fetchStaff,
  fetchStaffSalaryLogs,
  type StaffMember,
  type StaffSalaryLog,
} from "./api";

type StaffDetails = {
  salaryLogs: StaffSalaryLog[];
};

function StaffEntrySection({ item, reload }: { item: StaffMember; reload: () => Promise<void> }) {
  const [amount, setAmount] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Salary Payment</p>
      <div className="flex gap-2">
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button
          onClick={async () => {
            await createStaffSalaryLog(item.id, { amount: Number(amount || 0) });
            setAmount("");
            await reload();
          }}
        >
          Mark Paid
        </Button>
      </div>
    </div>
  );
}

export const staffConfig: EntityConfig<StaffMember, StaffDetails> = {
  module: "staff",
  title: "Staff",
  subtitle: "Manage staff, roles and salary logs.",
  addLabel: "Add Staff",
  columns: [
    { key: "name", label: "Name", className: "pl-6 font-medium" },
    { key: "mobile", label: "Mobile" },
    { key: "role", label: "Role" },
    { key: "salary", label: "Salary", className: "pr-6 text-right", render: (item) => formatInr(item.salary) },
  ],
  formFields: [
    { name: "name", label: "Name", type: "text" },
    { name: "mobile", label: "Mobile", type: "text" },
    { name: "role", label: "Role", type: "text" },
    { name: "salary", label: "Salary", type: "number" },
  ],
  getRowId: (item) => item.id,
  search: (item, q) =>
    item.name.toLowerCase().includes(q) ||
    item.mobile.toLowerCase().includes(q) ||
    item.role.toLowerCase().includes(q),
  list: async (ctx) => fetchStaff(ctx.categoryId),
  create: async (ctx, values) => {
    await createStaff({
      categoryId: ctx.categoryId,
      name: values.name,
      mobile: values.mobile,
      role: values.role,
      salary: Number(values.salary || 0),
    });
  },
  details: {
    title: (item) => item.name,
    subtitle: (item) => `${item.role} â€¢ ${item.mobile}`,
    loadDetails: async (item) => ({ salaryLogs: await fetchStaffSalaryLogs(item.id) }),
    renderSummary: (item) => (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Role</p>
          <p className="font-medium">{item.role}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Salary</p>
          <p className="font-semibold">{formatInr(item.salary)}</p>
        </div>
      </div>
    ),
    renderLogs: (_, details) => (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Salary Logs</p>
        {!details?.salaryLogs.length ? (
          <p className="text-sm text-muted-foreground">No salary logs.</p>
        ) : (
          details.salaryLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <p className="text-xs text-muted-foreground">{formatDateTime(log.date)}</p>
              <p className="font-semibold">{formatInr(log.amount)}</p>
            </div>
          ))
        )}
      </div>
    ),
    renderEntry: (item, _, { reload }) => <StaffEntrySection item={item} reload={reload} />,
  },
};

