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
} from "@untitledui/icons";
import { useState, useEffect } from "react";
import { useGetBackofficeMe } from "@workspace/api-client-react";
import { cx } from "@/utils/cx";

interface BackofficeLayoutProps {
  children: React.ReactNode;
}

const navGroups = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutGrid01 },
      { href: "/leads", label: "Leads Queue", icon: Users01 },
      { href: "/kyc", label: "KYC Queue", icon: Shield01 },
      { href: "/product-requests", label: "Product Requests", icon: File06 },
      { href: "/offers", label: "Pending Offers", icon: Tag01 },
      { href: "/quotes", label: "Held Quotes", icon: Receipt },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/clients", label: "Clients", icon: UserSquare },
      { href: "/suppliers", label: "Suppliers", icon: ShoppingBag01 },
      { href: "/products", label: "Product Catalog", icon: Package },
      { href: "/orders", label: "Orders", icon: File06 },
    ],
  },
  {
    label: "Finance & Admin",
    items: [
      { href: "/margins", label: "Margin Rules", icon: BarChart01 },
      { href: "/audit-log", label: "Audit Log", icon: File06 },
      { href: "/settings", label: "Platform Settings", icon: Settings01 },
      { href: "/internal-users", label: "Internal Users", icon: Shield01 },
    ],
  },
];

function SidebarNav({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-widest text-[rgb(100,90,70)]">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={onNavigate}
                    className={cx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[rgb(50,50,50)] text-[rgb(255,109,67)]"
                        : "text-[rgb(180,170,150)] hover:bg-[rgb(38,38,38)] hover:text-[rgb(220,210,190)]",
                    )}
                    data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function BackofficeLayout({ children }: BackofficeLayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user, isLoading } = useGetBackofficeMe();

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
      <div className="min-h-screen flex items-center justify-center bg-color-bg-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[rgb(255,109,67)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-color-bg-secondary">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[rgb(26,26,26)] text-[rgb(220,210,190)] border-r border-[rgb(44,44,44)]">
        <div className="px-6 py-5 border-b border-[rgb(44,44,44)]">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
            <div>
              <h1 className="text-sm font-bold text-[rgb(255,109,67)] leading-none">MWRD</h1>
              <p className="text-xs text-[rgb(100,90,70)] mt-0.5">Backoffice</p>
            </div>
          </div>
        </div>

        <SidebarNav location={location} />

        <div className="px-3 py-4 border-t border-[rgb(44,44,44)]">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-[rgb(255,109,67)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {user.user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[rgb(220,210,190)]">{user.user?.email}</p>
                <p className="text-xs text-[rgb(100,90,70)] capitalize">{user.user?.role}</p>
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

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex flex-col w-72 bg-[rgb(26,26,26)] text-[rgb(220,210,190)] z-50">
            <div className="px-6 py-5 border-b border-[rgb(44,44,44)]">
              <h1 className="text-sm font-bold text-[rgb(255,109,67)]">MWRD Backoffice</h1>
            </div>
            <SidebarNav location={location} onNavigate={() => setMobileOpen(false)} />
            <div className="p-3 border-t border-[rgb(44,44,44)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgb(150,140,120)] hover:bg-[rgb(38,38,38)] hover:text-[rgb(220,210,190)] transition-colors"
              >
                <LogOut01 className="w-5 h-5 shrink-0" aria-hidden />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-16 border-b border-color-border-secondary flex items-center px-4 justify-between md:hidden bg-color-bg-primary">
          <h1 className="text-lg font-bold text-color-text-primary">MWRD Backoffice</h1>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-color-fg-tertiary hover:bg-color-bg-secondary transition-colors"
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
