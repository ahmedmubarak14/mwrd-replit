import { useLocation, Route, Switch, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import LeadsQueuePage from "@/pages/LeadsQueuePage";
import KycQueuePage from "@/pages/KycQueuePage";
import ClientsPage from "@/pages/ClientsPage";
import SuppliersPage from "@/pages/SuppliersPage";
import ProductsPage from "@/pages/ProductsPage";
import OffersQueuePage from "@/pages/OffersQueuePage";
import ProductRequestsPage from "@/pages/ProductRequestsPage";
import QuotesReviewPage from "@/pages/QuotesReviewPage";
import OrdersPage from "@/pages/OrdersPage";
import ThreeWayMatchPage from "@/pages/ThreeWayMatchPage";
import MarginsPage from "@/pages/MarginsPage";
import AuditLogPage from "@/pages/AuditLogPage";
import SettingsPage from "@/pages/SettingsPage";
import InternalUsersPage from "@/pages/InternalUsersPage";
import NotFound from "@/pages/not-found";
import BackofficeLayout from "@/components/layout/BackofficeLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path: string }) {
  const token = localStorage.getItem("mwrd_bo_token");
  const [, setLocation] = useLocation();

  if (!token) {
    setLocation("/login");
    return null;
  }

  return (
    <BackofficeLayout>
      <Component />
    </BackofficeLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        {() => <ProtectedRoute component={DashboardPage} path="/" />}
      </Route>
      <Route path="/leads">
        {() => <ProtectedRoute component={LeadsQueuePage} path="/leads" />}
      </Route>
      <Route path="/kyc">
        {() => <ProtectedRoute component={KycQueuePage} path="/kyc" />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={ClientsPage} path="/clients" />}
      </Route>
      <Route path="/suppliers">
        {() => <ProtectedRoute component={SuppliersPage} path="/suppliers" />}
      </Route>
      <Route path="/products">
        {() => <ProtectedRoute component={ProductsPage} path="/products" />}
      </Route>
      <Route path="/offers">
        {() => <ProtectedRoute component={OffersQueuePage} path="/offers" />}
      </Route>
      <Route path="/product-requests">
        {() => <ProtectedRoute component={ProductRequestsPage} path="/product-requests" />}
      </Route>
      <Route path="/quotes">
        {() => <ProtectedRoute component={QuotesReviewPage} path="/quotes" />}
      </Route>
      <Route path="/orders">
        {() => <ProtectedRoute component={OrdersPage} path="/orders" />}
      </Route>
      <Route path="/three-way-match">
        {() => <ProtectedRoute component={ThreeWayMatchPage} path="/three-way-match" />}
      </Route>
      <Route path="/margins">
        {() => <ProtectedRoute component={MarginsPage} path="/margins" />}
      </Route>
      <Route path="/audit-log">
        {() => <ProtectedRoute component={AuditLogPage} path="/audit-log" />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} path="/settings" />}
      </Route>
      <Route path="/internal-users">
        {() => <ProtectedRoute component={InternalUsersPage} path="/internal-users" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
