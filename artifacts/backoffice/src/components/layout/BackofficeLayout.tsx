import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Package, 
  Tag, 
  ShoppingBag, 
  FileText, 
  Receipt, 
  Percent, 
  History, 
  Settings, 
  ShieldCheck,
  LogOut,
  ChevronRight,
  Menu
} from "lucide-react";
import { useState, useEffect } from "react";
import { useGetBackofficeMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider,
  SidebarFooter
} from "@/components/ui/sidebar";

interface BackofficeLayoutProps {
  children: React.ReactNode;
}

export default function BackofficeLayout({ children }: BackofficeLayoutProps) {
  const [location, setLocation] = useLocation();
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

  const navItems = [
    { 
      label: "Operations",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/leads", label: "Leads Queue", icon: Users },
        { href: "/kyc", label: "KYC Queue", icon: ShieldCheck },
        { href: "/product-requests", label: "Product Requests", icon: FileText },
        { href: "/offers", label: "Pending Offers", icon: Tag },
        { href: "/quotes", label: "Held Quotes", icon: Receipt },
      ]
    },
    {
      label: "Management",
      items: [
        { href: "/clients", label: "Clients", icon: UserSquare2 },
        { href: "/suppliers", label: "Suppliers", icon: ShoppingBag },
        { href: "/products", label: "Product Catalog", icon: Package },
        { href: "/orders", label: "Orders", icon: FileText },
      ]
    },
    {
      label: "Finance & Admin",
      items: [
        { href: "/margins", label: "Margin Rules", icon: Percent },
        { href: "/audit-log", label: "Audit Log", icon: History },
        { href: "/settings", label: "Platform Settings", icon: Settings },
        { href: "/internal-users", label: "Internal Users", icon: ShieldCheck },
      ]
    }
  ];

  if (isLoading && location !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="hidden md:flex">
          <SidebarHeader className="p-4 border-b">
            <h1 className="text-xl font-bold truncate">MWRD Backoffice</h1>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              {navItems.map((group) => (
                <SidebarGroup key={group.label}>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <Link href={item.href}>
                            <SidebarMenuButton 
                              isActive={location === item.href}
                              tooltip={item.label}
                              data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      ))} persistence
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user?.user.email}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.user.role}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b flex items-center px-4 justify-between md:hidden">
            <h1 className="text-lg font-bold">MWRD Backoffice</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <div className="p-4 border-b">
                  <h1 className="text-xl font-bold">MWRD Backoffice</h1>
                </div>
                <ScrollArea className="h-[calc(100vh-4rem)]">
                  {navItems.map((group) => (group.items.map(item => (
                    <Link key={item.href} href={item.href}>
                      <a className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent ${location === item.href ? 'bg-accent' : ''}`}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    </Link>
                  ))))}
                  <Separator />
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </header>

          <div className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
