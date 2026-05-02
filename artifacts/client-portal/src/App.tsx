import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import NotFound from "@/pages/not-found";

// Page Imports
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import CatalogPage from "@/pages/CatalogPage";
import CartPage from "@/pages/CartPage";
import RFQsPage from "@/pages/RFQsPage";
import RFQDetailPage from "@/pages/RFQDetailPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AccountPage from "@/pages/AccountPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const token = localStorage.getItem("mwrd_token");
  
  if (!token) {
    return <Redirect to="/login" />;
  }

  return (
    <DashboardLayout>
      <Component {...rest} />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      {/* Protected Routes */}
      <Route path="/">
        {(params) => <ProtectedRoute component={DashboardPage} path="/" {...params} />}
      </Route>
      <Route path="/catalog">
        {(params) => <ProtectedRoute component={CatalogPage} path="/catalog" {...params} />}
      </Route>
      <Route path="/cart">
        {(params) => <ProtectedRoute component={CartPage} path="/cart" {...params} />}
      </Route>
      <Route path="/rfqs">
        {(params) => <ProtectedRoute component={RFQsPage} path="/rfqs" {...params} />}
      </Route>
      <Route path="/rfqs/:id">
        {(params) => <ProtectedRoute component={RFQDetailPage} path="/rfqs/:id" {...params} />}
      </Route>
      <Route path="/orders">
        {(params) => <ProtectedRoute component={OrdersPage} path="/orders" {...params} />}
      </Route>
      <Route path="/orders/:id">
        {(params) => <ProtectedRoute component={OrderDetailPage} path="/orders/:id" {...params} />}
      </Route>
      <Route path="/notifications">
        {(params) => <ProtectedRoute component={NotificationsPage} path="/notifications" {...params} />}
      </Route>
      <Route path="/account">
        {(params) => <ProtectedRoute component={AccountPage} path="/account" {...params} />}
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
