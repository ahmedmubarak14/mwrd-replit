import { Sidebar } from "./Sidebar";
import { CustomRequestBanner } from "./CustomRequestBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            {children}
          </div>
        </div>
        <CustomRequestBanner />
      </main>
    </div>
  );
}
