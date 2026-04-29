import { useNavigate } from "react-router-dom";
import { BusinessSwitcher } from "@/components/dashboard/BusinessSwitcher";
import { type Category } from "@/modules/categories/api/categories.api";

type ModuleKey = "customers" | "inventory" | "suppliers" | "staff";

const MODULES: { key: ModuleKey; label: string }[] = [
  { key: "customers", label: "Customers" },
  { key: "inventory", label: "Inventory" },
  { key: "suppliers", label: "Suppliers" },
  { key: "staff", label: "Staff" },
];

type HeaderProps = {
  businesses: Category[];
  activeBusinessId: number | null;
  activeModule: ModuleKey;
  onSwitchBusiness: (businessId: number) => void;
  onCreateBusiness: () => void;
};

export function Header({
  businesses,
  activeBusinessId,
  activeModule,
  onSwitchBusiness,
  onCreateBusiness,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
      <BusinessSwitcher
        businesses={businesses}
        activeBusinessId={activeBusinessId}
        onSwitchBusiness={(id) => {
          onSwitchBusiness(id);
          navigate(`/business/${id}/${activeModule}`);
        }}
        onCreateBusiness={onCreateBusiness}
      />
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
        {MODULES.map((module) => {
          const isActive = module.key === activeModule;
          return (
            <button
              key={module.key}
              type="button"
              onClick={() => {
                if (!activeBusinessId) return;
                navigate(`/business/${activeBusinessId}/${module.key}`);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/70"
              }`}
            >
              {module.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

