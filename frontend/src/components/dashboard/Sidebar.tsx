import { useEffect, useMemo, useRef, useState } from "react";
import { Dumbbell, GraduationCap, LayoutDashboard, MoreHorizontal, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ThemeMode } from "@/shared/lib/theme";
import { type Category } from "@/modules/categories/api/categories.api";
import { ProfileMenu } from "./ProfileMenu";
import { ToggleButton } from "./ToggleButton";

type SidebarProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  userName?: string | null;
  userEmail?: string | null;
  theme: ThemeMode;
  signingOut: boolean;
  businesses: Category[];
  activeBusinessId: number | null;
  onNavigateDashboard: () => void;
  onOpenCreateBusiness: () => void;
  onSwitchBusiness: (businessId: number) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onClose: () => void;
  onToggleCollapse: () => void;
  onOpenBusinessDetails: (business: Category) => void;
  onUpdateBusiness: (categoryId: number, payload: { name?: string; isActive?: boolean }) => Promise<void>;
  onDeleteBusiness: (categoryId: number) => Promise<void>;
};

export function Sidebar({
  isOpen,
  isCollapsed,
  userName,
  userEmail,
  theme,
  signingOut,
  businesses,
  activeBusinessId,
  onNavigateDashboard,
  onOpenCreateBusiness,
  onSwitchBusiness,
  onToggleTheme,
  onLogout,
  onClose,
  onToggleCollapse,
  onOpenBusinessDetails,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [focusSearchOnExpand, setFocusSearchOnExpand] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const getBusinessIcon = (type: Category["type"]) => {
    if (type === "shop") return Store;
    if (type === "institute") return GraduationCap;
    return Dumbbell;
  };

  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return businesses;
    return businesses.filter((business) => business.name.toLowerCase().includes(query));
  }, [businesses, searchQuery]);

  useEffect(() => {
    if (!isCollapsed && focusSearchOnExpand) {
      searchInputRef.current?.focus();
      setFocusSearchOnExpand(false);
    }
  }, [focusSearchOnExpand, isCollapsed]);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col overflow-hidden border-r border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur transition-[width,transform] duration-300 md:translate-x-0 ${
          isCollapsed ? "md:w-[70px]" : "md:w-60"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full md:flex"
        }`}
        onClick={() => {
          if (isCollapsed) {
            onToggleCollapse();
          }
        }}
      >
        <div className={`mb-2 flex items-center ${isCollapsed ? "justify-center" : "justify-end"}`}>
          <ToggleButton collapsed={isCollapsed} onToggle={onToggleCollapse} />
        </div>

        <div className={`mt-2 flex min-h-0 flex-1 flex-col ${isCollapsed ? "space-y-2" : ""}`}>
          {!isCollapsed ? (
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Navigation
            </p>
          ) : null}
          <button
            type="button"
            className={`flex w-full items-center rounded-lg bg-primary/10 text-left text-sm font-medium text-primary ${
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
            }`}
            onClick={onNavigateDashboard}
            aria-label="Dashboard"
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard className="size-4" />
            {!isCollapsed ? "Dashboard" : null}
          </button>

          <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {isCollapsed ? (
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-lg border border-border/70 px-2 py-2.5 hover:bg-muted/80"
                aria-label="Search business"
                title="Search business"
                onClick={(event) => {
                  event.stopPropagation();
                  setFocusSearchOnExpand(true);
                  onToggleCollapse();
                }}
              >
                <Search className="size-4" />
              </button>
            ) : (
              <>
                <div className="mb-2 px-1">
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search businesses..."
                    className="h-8"
                  />
                </div>

                {businesses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-3">
                    <p className="text-xs text-muted-foreground">No business found</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                      onClick={onOpenCreateBusiness}
                    >
                      Create Business
                    </button>
                  </div>
                ) : filteredBusinesses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-3 text-xs text-muted-foreground">
                    No matching business
                  </div>
                ) : (
                  filteredBusinesses.map((business) => {
                    const Icon = getBusinessIcon(business.type);
                    const isActive = business.id === activeBusinessId;
                    return (
                      <div
                        key={business.id}
                        className={`flex w-full items-center rounded-lg text-left text-sm transition-colors ${
                          isActive ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted/80"
                        } gap-2 px-2 py-1.5`}
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          onClick={() => onSwitchBusiness(business.id)}
                          aria-label={business.name}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{business.name}</span>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          aria-label={`View ${business.name} details`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenBusinessDetails(business);
                          }}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-3 shrink-0 border-t border-border/70 pt-3">
          <ProfileMenu
            collapsed={isCollapsed}
            userName={userName}
            userEmail={userEmail}
            theme={theme}
            signingOut={signingOut}
            businesses={businesses}
            activeBusinessId={activeBusinessId}
            onOpenCreateBusiness={onOpenCreateBusiness}
            onSwitchBusiness={onSwitchBusiness}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
          />
        </div>
      </aside>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
        />
      ) : null}
    </>
  );
}


