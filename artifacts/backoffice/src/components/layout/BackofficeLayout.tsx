import { Link, useLocation } from "wouter";
import {
  LayoutGrid01,
  Users01,
  Shield01,
  File06,
  Tag01,
  Receipt,
  UserSquare,
  ShoppingBag01,
  Package,
  BarChart01,
  LogOut01,
  Menu01,
  Settings01,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "@untitledui/icons";
import { useState, useEffect, useRef } from "react";
import { useGetBackofficeMe } from "@workspace/api-client-react";
import { cx } from "@/utils/cx";

const STORAGE_KEY = "mwrd_sidebar_collapsed";

interface BackofficeLayoutProps {
  children: React.ReactNode;
}

type NavDivider = { divider: true; label?: string };
type NavLeaf = {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: number;
};
type NavGroup = {
  label: string;
  icon: React.ComponentType<any>;
  items: { href: string; label: string; badge?: number }[];
};
type NavItem = NavDivider | NavLeaf | NavGroup;

const navConfig: NavItem[] = [
  { href: "/", icon: LayoutGrid01, label: "Dashboard" },
  { divider: true, label: "Operations" },
  { href: "/leads", icon: Users01, label: "Leads Queue" },
  { href: "/kyc", icon: Shield01, label: "KYC Queue" },
  { href: "/product-requests", icon: File06, label: "Product Requests" },
  { href: "/offers", icon: Tag01, label: "Pending Offers" },
  { href: "/quotes", icon: Receipt, label: "Held Quotes" },
  { divider: true, label: "Management" },
  { href: "/clients", icon: UserSquare, label: "Clients" },
  { href: "/suppliers", icon: ShoppingBag01, label: "Suppliers" },
  { href: "/products", icon: Package, label: "Product Catalog" },
  { href: "/orders", icon: File06, label: "Orders" },
  { divider: true, label: "Finance & Admin" },
  { href: "/margins", icon: BarChart01, label: "Margin Rules" },
  { href: "/audit-log", icon: File06, label: "Audit Log" },
  { href: "/settings", icon: Settings01, label: "Platform Settings" },
  { href: "/internal-users", icon: Shield01, label: "Internal Users" },
];

function isDivider(item: NavItem): item is NavDivider {
  return "divider" in item;
}
function isGroup(item: NavItem): item is NavGroup {
  return "items" in item;
}

function NavLeafItem({
  item,
  location,
  collapsed,
  onNavigate,
}: {
  item: NavLeaf;
  location: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const isActive = location === item.href;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={cx(
        "group flex items-center rounded-lg text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2",
        isActive
          ? "bg-[rgb(249,250,251)] text-[rgb(16,24,40)]"
          : "text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] hover:text-[rgb(52,64,84)]",
      )}
      data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <item.icon
        className={cx(
          "w-[18px] h-[18px] shrink-0 transition-colors",
          isActive
            ? "text-[rgb(255,109,67)]"
            : "text-[rgb(152,162,179)] group-hover:text-[rgb(102,112,133)]",
        )}
        aria-hidden
      />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && (
            <span className="ml-auto text-xs font-medium bg-[rgb(242,244,247)] text-[rgb(102,112,133)] rounded-full px-2 py-0.5 min-w-[22px] text-center">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function NavGroupItem({
  item,
  location,
  collapsed,
  onNavigate,
}: {
  item: NavGroup;
  location: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const isAnyChildActive = item.items.some((child) => location === child.href);
  const [open, setOpen] = useState(isAnyChildActive);

  if (collapsed) {
    const firstChild = item.items[0];
    return (
      <Link
        href={firstChild.href}
        onClick={onNavigate}
        title={item.label}
        aria-label={item.label}
        className={cx(
          "group flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-sm font-medium transition-all duration-150",
          isAnyChildActive
            ? "bg-[rgb(249,250,251)] text-[rgb(16,24,40)]"
            : "text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] hover:text-[rgb(52,64,84)]",
        )}
      >
        <item.icon
          className={cx(
            "w-[18px] h-[18px] shrink-0 transition-colors",
            isAnyChildActive
              ? "text-[rgb(255,109,67)]"
              : "text-[rgb(152,162,179)] group-hover:text-[rgb(102,112,133)]",
          )}
          aria-hidden
        />
      </Link>
    );
  }

  const panelId = `nav-group-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cx(
          "group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
          isAnyChildActive
            ? "text-[rgb(16,24,40)]"
            : "text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] hover:text-[rgb(52,64,84)]",
        )}
      >
        <item.icon
          className={cx(
            "w-[18px] h-[18px] shrink-0 transition-colors",
            isAnyChildActive
              ? "text-[rgb(255,109,67)]"
              : "text-[rgb(152,162,179)] group-hover:text-[rgb(102,112,133)]",
          )}
          aria-hidden
        />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cx(
            "w-4 h-4 text-[rgb(152,162,179)] transition-transform duration-200",
            open ? "rotate-180" : "",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div id={panelId} className="mt-0.5 ml-[30px] space-y-0.5 border-l border-[rgb(228,231,236)] pl-3">
          {item.items.map((child) => {
            const isActive = location === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cx(
                  "flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-all duration-150",
                  isActive
                    ? "text-[rgb(255,109,67)] font-medium"
                    : "text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]",
                )}
              >
                <span>{child.label}</span>
                {child.badge !== undefined && (
                  <span className="text-xs font-medium bg-[rgb(242,244,247)] text-[rgb(102,112,133)] rounded-full px-2 py-0.5 min-w-[22px] text-center">
                    {child.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarNav({
  location,
  collapsed,
  onNavigate,
}: {
  location: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className={cx("flex-1 overflow-y-auto py-4 space-y-0.5", collapsed ? "px-2" : "px-3")}>
      {navConfig.map((item, i) => {
        if (isDivider(item)) {
          // Slim mode: always render as a thin border divider, no label
          if (collapsed) {
            return <div key={`divider-${i}`} className="my-2 border-t border-[rgb(228,231,236)]" />;
          }
          return (
            <div key={`divider-${i}`} className="pt-4 pb-1">
              {item.label ? (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[rgb(152,162,179)]">
                  {item.label}
                </p>
              ) : (
                <div className="border-t border-[rgb(228,231,236)]" />
              )}
            </div>
          );
        }
        if (isGroup(item)) {
          return (
            <NavGroupItem
              key={item.label}
              item={item}
              location={location}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        }
        return (
          <NavLeafItem
            key={item.href}
            item={item}
            location={location}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

export default function BackofficeLayout({ children }: BackofficeLayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user, isLoading } = useGetBackofficeMe();
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const handleLogoClick = () => {
    if (clickTimerRef.current !== null) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      window.location.href = "/landing/";
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        setLocation("/");
      }, 260);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("mwrd_bo_token");
    if (!token && location !== "/login") {
      setLocation("/login");
    }
  }, [location, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("mwrd_bo_token");
    setLocation("/login");
  };

  if (isLoading && location !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(249,250,251)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[rgb(255,109,67)] border-t-transparent" />
      </div>
    );
  }

  const sidebarFooter = (slim: boolean) => (
    <div className={cx("border-t border-[rgb(228,231,236)] py-3 space-y-0.5", slim ? "px-2" : "px-3")}>
      {user && (
        slim ? (
          <div className="flex justify-center mb-1" title={user.user?.email || ""}>
            <div className="w-9 h-9 rounded-full bg-[rgb(255,109,67)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user.user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[rgb(255,109,67)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user.user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[rgb(16,24,40)]">
                {user.user?.email}
              </p>
              <p className="text-xs text-[rgb(152,162,179)] capitalize">{user.user?.role}</p>
            </div>
          </div>
        )
      )}
      <button
        onClick={handleLogout}
        title={slim ? "Log out" : undefined}
        aria-label="Log out"
        className={cx(
          "flex items-center rounded-lg text-sm font-medium text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] hover:text-[rgb(52,64,84)] transition-colors",
          slim ? "justify-center h-10 w-10 mx-auto" : "w-full gap-3 px-3 py-2",
        )}
        data-testid="button-logout"
      >
        <LogOut01 className="w-[18px] h-[18px] shrink-0 text-[rgb(152,162,179)]" aria-hidden />
        {!slim && <span>Log out</span>}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[rgb(249,250,251)]">
      {/* Desktop Sidebar */}
      <aside
        className={cx(
          "relative hidden md:flex flex-col shrink-0 bg-white border-r border-[rgb(228,231,236)] transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div
          className={cx(
            "flex h-16 items-center border-b border-[rgb(228,231,236)]",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <button
            onClick={handleLogoClick}
            className="flex items-center cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(255,109,67)]/40"
            aria-label="Go to dashboard"
          >
            {collapsed ? (
              <div className="h-9 w-9 rounded-lg bg-[rgb(255,109,67)] flex items-center justify-center">
                <span className="text-white text-base font-bold">M</span>
              </div>
            ) : (
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-[52px] -right-3 z-20 h-6 w-6 rounded-full bg-white border border-[rgb(228,231,236)] shadow-sm flex items-center justify-center text-[rgb(102,112,133)] hover:text-[rgb(255,109,67)] hover:border-[rgb(255,109,67)] transition-colors"
          data-testid="button-sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <SidebarNav location={location} collapsed={collapsed} />
        {sidebarFooter(collapsed)}
      </aside>

      {/* Mobile overlay drawer (always full width, never slim) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex flex-col w-72 bg-white border-r border-[rgb(228,231,236)] z-50">
            <div className="flex h-16 items-center px-5 border-b border-[rgb(228,231,236)]">
              <button
                onClick={handleLogoClick}
                className="flex items-center cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(255,109,67)]/40"
                aria-label="Go to dashboard"
              >
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
              </button>
            </div>
            <SidebarNav location={location} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            {sidebarFooter(false)}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[rgb(228,231,236)] flex items-center px-4 justify-between md:hidden bg-white">
          <button onClick={handleLogoClick} className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(255,109,67)]/40" aria-label="Go to dashboard">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] transition-colors"
          >
            <Menu01 className="h-6 w-6" aria-hidden />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
