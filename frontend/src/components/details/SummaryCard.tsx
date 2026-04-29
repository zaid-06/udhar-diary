import { formatInr } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date-time";
import { type StudentDetails } from "@/services/student-details.service";

type SummaryCardProps = {
  totalAmount: number;
  createdAt: string;
  partyTypeLabel: string;
  studentDetails: StudentDetails | null;
};

export function SummaryCard({ totalAmount, createdAt, partyTypeLabel, studentDetails }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-bold text-primary">{formatInr(totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Created Date</p>
          <p className="text-sm font-medium">{formatDateTime(createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="text-sm font-medium">{partyTypeLabel}</p>
        </div>
        {studentDetails ? (
          <div>
            <p className="text-xs text-muted-foreground">Class / Roll Number</p>
            <p className="text-sm font-medium">
              {studentDetails.class} / {studentDetails.rollNumber}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
