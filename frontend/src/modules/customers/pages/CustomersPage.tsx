import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { EntityPage } from "@/components/entity/EntityPage";
import { customerConfig } from "../config";

export default function CustomersPage() {
  const { businessId } = useParams<{ businessId: string }>();

  useEffect(() => {
    if (!businessId) return;
    window.localStorage.setItem("selectedBusinessId", businessId);
  }, [businessId]);

  return <EntityPage config={customerConfig} />;
}
