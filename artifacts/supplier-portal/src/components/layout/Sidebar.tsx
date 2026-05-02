import { Link, useLocation } from "wouter";
import {
  LayoutGrid01,
  File06,
  MessageChatCircle,
  ShoppingCart01,
  Package,
  Tag01,
  Bell01,
  User01,
  LogOut01,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "@untitledui/icons";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

const STORAGE_KEY = "mwrd_sidebar_collapsed";

type NavDivider = { divider: true };
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
  { href: "/rfqs", icon: File06, label: "RFQs" },
  { href: "/quotes", icon: MessageChatCircle, label: "Quotes" },
  { divider: true },
  { href: "/orders", icon: ShoppingCart01, label: "Orders" },
  {
    label: "Offers",
    icon: Tag01,
    items: [
      { href: "/offers", label: "All Offers" },
      { href: "/offers/new", label: "New Offer" },
    ],
  },
  { href: "/product-requests", icon: Package, label: "Product Requests" },
  { divider: true },
  { href: "/notifications", icon: Bell01, label: "Notifications" },
  { href: "/account", icon: User01, label: "Account" },
];

function isDivider(item: NavItem): item is NavDivider {
  return "divider" in item;
}
function isGroup(item: NavItem): item is NavGroup {
  return "items" in item;
}

function NavLeafItem({ item, location, collapsed }: { item: NavLeaf; location: string; collapsed: boolean }) {
  const isActive = location === item.href;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={cx(
        "group flex items-center rounded-lg text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2",
        isActive
          ? "bg-[rgb(249,250,251)] text-[rgb(16,24,40)]"
          : "text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] hover:text-[rgb(52,64,84)]",
      )}
      data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
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

function NavGroupItem({ item, location, collapsed }: { item: NavGroup; location: string; collapsed: boolean }) {
  const isAnyChildActive = item.items.some((child) => location === child.href);
  const [open, setOpen] = useState(isAnyChildActive);

  // Slim mode: render as a single icon-link to first child
  if (collapsed) {
    const firstChild = item.items[0];
    return (
      <Link
        href={firstChild.href}
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

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
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

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("mwrd_supplier_token");
        window.location.replace("/login");
      },
    });
  };

  return (
    <aside
      className={cx(
        "relative flex h-full shrink-0 flex-col bg-white border-r border-[rgb(228,231,236)] transition-[width] duration-200",
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

      <nav className={cx("flex-1 overflow-y-auto py-4 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {navConfig.map((item, i) => {
          if (isDivider(item)) {
            return <div key={`divider-${i}`} className="my-2 border-t border-[rgb(228,231,236)]" />;
          }
          if (isGroup(item)) {
            return <NavGroupItem key={item.label} item={item} location={location} collapsed={collapsed} />;
          }
          return <NavLeafItem key={item.href} item={item} location={location} collapsed={collapsed} />;
        })}
      </nav>

      <div className={cx("border-t border-[rgb(228,231,236)] py-3 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {user && (
          collapsed ? (
            <div className="flex justify-center mb-1" title={(user.user as any)?.real_name || ""}>
              <div className="w-9 h-9 rounded-full bg-[rgb(255,109,67)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {(user.user as any)?.real_name?.charAt(0) || "S"}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[rgb(255,109,67)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {(user.user as any)?.real_name?.charAt(0) || "S"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[rgb(16,24,40)]">
                  {(user.user as any)?.real_name}
                </p>
                <p className="text-xs text-[rgb(152,162,179)] truncate">{user.user?.email}</p>
              </div>
            </div>
          )
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          aria-label="Log out"
          className={cx(
            "flex items-center rounded-lg text-sm font-medium text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] hover:text-[rgb(52,64,84)] transition-colors",
            collapsed ? "justify-center h-10 w-10 mx-auto" : "w-full gap-3 px-3 py-2",
          )}
          data-testid="button-logout"
        >
          <LogOut01 className="w-[18px] h-[18px] shrink-0 text-[rgb(152,162,179)]" aria-hidden />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
