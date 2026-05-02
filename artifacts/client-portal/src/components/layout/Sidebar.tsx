import { Link, useLocation } from "wouter";
import {
  LayoutGrid01,
  ShoppingBag01,
  ShoppingCart01,
  File06,
  Package,
  Bell01,
  User01,
  LogOut01,
} from "@untitledui/icons";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useRef } from "react";
import { cx } from "@/utils/cx";

type NavDivider = { divider: true };
type NavLeaf = {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: number;
};
type NavItem = NavDivider | NavLeaf;

const navConfig: NavItem[] = [
  { href: "/", icon: LayoutGrid01, label: "Dashboard" },
  { href: "/catalog", icon: ShoppingBag01, label: "Catalog" },
  { href: "/cart", icon: ShoppingCart01, label: "Cart" },
  { divider: true },
  { href: "/rfqs", icon: File06, label: "RFQs" },
  { href: "/orders", icon: Package, label: "Orders" },
  { divider: true },
  { href: "/notifications", icon: Bell01, label: "Notifications" },
  { href: "/account", icon: User01, label: "Account" },
];

function isDivider(item: NavItem): item is NavDivider {
  return "divider" in item;
}

function NavLeafItem({ item, location }: { item: NavLeaf; location: string }) {
  const isActive = location === item.href;
  return (
    <Link href={item.href}>
      <a
        className={cx(
          "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-white/[0.08] text-[#FF6D43]"
            : "text-[rgb(160,152,138)] hover:bg-white/[0.05] hover:text-[rgb(220,210,190)]",
        )}
        data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <item.icon
          className={cx(
            "w-[18px] h-[18px] shrink-0 transition-colors",
            isActive
              ? "text-[#FF6D43]"
              : "text-[rgb(120,112,98)] group-hover:text-[rgb(180,170,150)]",
          )}
          aria-hidden
        />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && (
          <span className="ml-auto text-xs font-medium bg-white/[0.08] text-[rgb(140,132,118)] rounded-full px-2 py-0.5 min-w-[22px] text-center">
            {item.badge}
          </span>
        )}
      </a>
    </Link>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
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
        localStorage.removeItem("mwrd_token");
        window.location.href = "/login";
      },
    });
  };

  return (
    <aside
      className={cx(
        "flex flex-col h-screen w-64 shrink-0",
        "bg-[rgb(18,18,18)] border-r border-[rgb(38,38,38)]",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-[rgb(38,38,38)]">
        <button
          onClick={handleLogoClick}
          className="flex items-center cursor-pointer focus:outline-none"
          aria-label="Go to dashboard"
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navConfig.map((item, i) => {
          if (isDivider(item)) {
            return <div key={`divider-${i}`} className="my-2 border-t border-[rgb(38,38,38)]" />;
          }
          return <NavLeafItem key={item.href} item={item} location={location} />;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[rgb(38,38,38)] p-3 space-y-0.5">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#FF6D43] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {(user.user as any)?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[rgb(210,200,180)]">
                {(user.user as any)?.full_name}
              </p>
              <p className="text-xs text-[rgb(100,92,78)] truncate">
                {(user.company as any)?.name}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[rgb(130,122,108)] hover:bg-white/[0.05] hover:text-[rgb(200,190,170)] transition-colors"
          data-testid="button-logout"
        >
          <LogOut01 className="w-[18px] h-[18px] shrink-0" aria-hidden />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
