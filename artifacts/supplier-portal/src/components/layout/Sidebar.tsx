import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Quote, 
  ShoppingCart, 
  Package, 
  PlusCircle, 
  Bell, 
  User, 
  LogOut,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGetMe, useLogout } from "@workspace/api-client-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rfqs", label: "RFQs", icon: FileText },
  { href: "/quotes", label: "Quotes", icon: Quote },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/offers", label: "Offers", icon: Package },
  { href: "/offers/new", label: "New Offer", icon: PlusCircle },
  { href: "/product-requests", label: "Product Requests", icon: PlusCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/account", label: "Account", icon: User },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("mwrd_token");
        setLocation("/login");
      }
    });
  };

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Building2 className="h-6 w-6 text-sidebar-primary mr-2" />
        <span className="text-lg font-bold">MWRD Supplier</span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )}
              data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center mb-4 px-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.user.real_name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user.user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
