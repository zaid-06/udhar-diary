import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { EntityPage } from "@/components/entity/EntityPage";
import { formatInr } from "@/shared/lib/format-currency";
import { customerConfig } from "../config";

export default function CustomersPage() {
  const { businessId } = useParams<{ businessId: string }>();

  useEffect(() => {
    if (!businessId) return;
    window.localStorage.setItem("selectedBusinessId", businessId);
  }, [businessId]);

  return (
    <EntityPage
      config={customerConfig}
      headerExtra={(customers) => {
        const totals = customers.reduce(
          (result, customer) => {
            const amount = Number(customer.unpaidAmount || 0);
            if (amount < 0) result.toGive += Math.abs(amount);
            else result.toGet += amount;
            return result;
          },
          { toGive: 0, toGet: 0 },
        );

        return (
          <div className="flex shrink-0 items-start justify-end gap-5 text-right">
            <div>
              <p className="text-xs font-medium text-muted-foreground">You Will Give</p>
              <p className="text-base font-semibold text-rose-600 dark:text-rose-400">
                {formatInr(totals.toGive)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">You Will Get</p>
              <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {formatInr(totals.toGet)}
              </p>
            </div>
          </div>
        );
      }}
    />
  );
}

