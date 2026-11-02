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
        const totalUnpaid = customers.reduce(
          (total, customer) => total + Number(customer.unpaidAmount || 0),
          0,
        );

        return (
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-xs font-medium text-muted-foreground">You Will Get</p>
            <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {formatInr(totalUnpaid)}
            </p>
          </div>
        );
      }}
    />
  );
}

