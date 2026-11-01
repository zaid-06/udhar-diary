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
  activeBusinessId: string | null;
  activeModule: ModuleKey;
  onSwitchBusiness: (businessId: string) => void;
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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary p-3 text-primary-foreground shadow-sm">
      <BusinessSwitcher
        businesses={businesses}
        activeBusinessId={activeBusinessId}
        onSwitchBusiness={(id) => {
          onSwitchBusiness(id);
          navigate(`/business/${id}/${activeModule}`);
        }}
        onCreateBusiness={onCreateBusiness}
      />
      <div className="flex items-center gap-1 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-1">
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
                isActive ? "bg-black text-white shadow-sm" : "text-primary-foreground/85 hover:bg-primary-foreground/15"
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

