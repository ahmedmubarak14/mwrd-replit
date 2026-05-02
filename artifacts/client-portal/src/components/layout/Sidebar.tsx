import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  FileText, 
  Package, 
  Bell, 
  User, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGetMe, useLogout } from "@workspace/api-client-react";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/catalog", icon: ShoppingBag, label: "Catalog" },
  { href: "/cart", icon: ShoppingCart, label: "Cart" },
  { href: "/rfqs", icon: FileText, label: "RFQs" },
  { href: "/orders", icon: Package, label: "Orders" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/account", icon: User, label: "Account" },
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
      }
    });
  };

  return (
    <div className={cn("flex flex-col h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border", className)}>
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-sidebar-primary">MWRD</h1>
        <p className="text-xs text-sidebar-foreground/60">Client Portal</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                )}
                data-testid={`link-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
              {user.user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.user?.full_name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.company?.name}</p>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
