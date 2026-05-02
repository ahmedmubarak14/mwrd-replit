import { Link, useLocation } from "wouter";
import {
  LayoutGrid01,
  File06,
  MessageChatCircle,
  ShoppingCart01,
  Package,
  PlusCircle,
  Bell01,
  User01,
  LogOut01,
} from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useGetMe, useLogout } from "@workspace/api-client-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutGrid01 },
  { href: "/rfqs", label: "RFQs", icon: File06 },
  { href: "/quotes", label: "Quotes", icon: MessageChatCircle },
  { href: "/orders", label: "Orders", icon: ShoppingCart01 },
  { href: "/offers", label: "Offers", icon: Package },
  { href: "/offers/new", label: "New Offer", icon: PlusCircle },
  { href: "/product-requests", label: "Product Requests", icon: PlusCircle },
  { href: "/notifications", label: "Notifications", icon: Bell01 },
  { href: "/account", label: "Account", icon: User01 },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("mwrd_supplier_token");
        setLocation("/login");
      },
    });
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[rgb(26,26,26)] text-[rgb(220,210,190)] border-r border-[rgb(44,44,44)]">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-[rgb(44,44,44)]">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto shrink-0" />
        <span className="text-sm font-bold text-[rgb(255,109,67)]">MWRD Supplier</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cx(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                location === item.href
                  ? "bg-[rgb(50,50,50)] text-[rgb(255,109,67)]"
                  : "text-[rgb(180,170,150)] hover:bg-[rgb(38,38,38)] hover:text-[rgb(220,210,190)]",
              )}
              data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-[rgb(44,44,44)]">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-[rgb(255,109,67)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user.user?.real_name?.charAt(0) || "S"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[rgb(220,210,190)]">{user.user?.real_name}</p>
              <p className="text-xs text-[rgb(120,110,90)] truncate">{user.user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgb(150,140,120)] hover:bg-[rgb(38,38,38)] hover:text-[rgb(220,210,190)] transition-colors"
          data-testid="button-logout"
        >
          <LogOut01 className="h-5 w-5 shrink-0" aria-hidden />
          Logout
        </button>
      </div>
    </aside>
  );
}
