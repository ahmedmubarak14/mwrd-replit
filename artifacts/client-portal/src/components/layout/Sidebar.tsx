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
import { cx } from "@/utils/cx";
import { useGetMe, useLogout } from "@workspace/api-client-react";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { href: "/", icon: LayoutGrid01, label: "Dashboard" },
  { href: "/catalog", icon: ShoppingBag01, label: "Catalog" },
  { href: "/cart", icon: ShoppingCart01, label: "Cart" },
  { href: "/rfqs", icon: File06, label: "RFQs" },
  { href: "/orders", icon: Package, label: "Orders" },
  { href: "/notifications", icon: Bell01, label: "Notifications" },
  { href: "/account", icon: User01, label: "Account" },
];

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

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
        "bg-[rgb(26,26,26)] text-[rgb(220,210,190)] border-r border-[rgb(44,44,44)]",
        className,
      )}
    >
      <div className="px-6 py-5 border-b border-[rgb(44,44,44)]">
        <div className="flex items-center gap-2.5">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[rgb(255,109,67)] leading-none">MWRD</h1>
            <p className="text-xs text-[rgb(160,150,130)] mt-0.5">Client Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                  isActive
                    ? "bg-[rgb(50,50,50)] text-[rgb(255,109,67)]"
                    : "text-[rgb(180,170,150)] hover:bg-[rgb(38,38,38)] hover:text-[rgb(220,210,190)]",
                )}
                data-testid={`link-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[rgb(44,44,44)]">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-[rgb(255,109,67)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user.user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[rgb(220,210,190)]">{user.user?.full_name}</p>
              <p className="text-xs text-[rgb(120,110,90)] truncate">{user.company?.name}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgb(150,140,120)] hover:bg-[rgb(38,38,38)] hover:text-[rgb(220,210,190)] transition-colors"
          data-testid="button-logout"
        >
          <LogOut01 className="w-5 h-5 shrink-0" aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
