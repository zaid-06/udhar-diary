import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";

type Props = {
  children: ReactNode;
  requireBusiness?: boolean;
};

export function BusinessRouteGuard({ children, requireBusiness = true }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { data: categories, isPending } = useCategories(!!user);

  if (isLoading || isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasBusiness = (categories?.length ?? 0) > 0;

  if (requireBusiness && !hasBusiness) {
    return <Navigate to="/business/create" replace />;
  }

  if (!requireBusiness && hasBusiness) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
