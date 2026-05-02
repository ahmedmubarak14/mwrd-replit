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
} from "@untitledui/icons";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useRef, useState } from "react";
import { cx } from "@/utils/cx";

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

function NavLeafItem({ item, location }: { item: NavLeaf; location: string }) {
  const isActive = location === item.href;
  return (
    <Link href={item.href}>
      <a
        className={cx(
          "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
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
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && (
          <span className="ml-auto text-xs font-medium bg-[rgb(242,244,247)] text-[rgb(102,112,133)] rounded-full px-2 py-0.5 min-w-[22px] text-center">
            {item.badge}
          </span>
        )}
      </a>
    </Link>
  );
}

function NavGroupItem({ item, location }: { item: NavGroup; location: string }) {
  const isAnyChildActive = item.items.some((child) => location === child.href);
  const [open, setOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
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
        <div className="mt-0.5 ml-[30px] space-y-0.5 border-l border-[rgb(228,231,236)] pl-3">
          {item.items.map((child) => {
            const isActive = location === child.href;
            return (
              <Link key={child.href} href={child.href}>
                <a
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
                </a>
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
    <aside className="flex h-full w-64 shrink-0 flex-col bg-white border-r border-[rgb(228,231,236)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-[rgb(228,231,236)]">
        <button
          onClick={handleLogoClick}
          className="flex items-center cursor-pointer focus:outline-none"
          aria-label="Go to dashboard"
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navConfig.map((item, i) => {
          if (isDivider(item)) {
            return <div key={`divider-${i}`} className="my-2 border-t border-[rgb(228,231,236)]" />;
          }
          if (isGroup(item)) {
            return <NavGroupItem key={item.label} item={item} location={location} />;
          }
          return <NavLeafItem key={item.href} item={item} location={location} />;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[rgb(228,231,236)] p-3 space-y-0.5">
        {user && (
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
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[rgb(102,112,133)] hover:bg-[rgb(249,250,251)] hover:text-[rgb(52,64,84)] transition-colors"
          data-testid="button-logout"
        >
          <LogOut01 className="w-[18px] h-[18px] shrink-0 text-[rgb(152,162,179)]" aria-hidden />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
