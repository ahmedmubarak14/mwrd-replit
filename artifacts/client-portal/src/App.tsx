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
import CategoryDetailPage from "@/pages/CategoryDetailPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import BundlesPage from "@/pages/BundlesPage";
import BundleDetailPage from "@/pages/BundleDetailPage";
import CartPage from "@/pages/CartPage";
import SavedCartsPage from "@/pages/SavedCartsPage";
import RFQsPage from "@/pages/RFQsPage";
import RFQDetailPage from "@/pages/RFQDetailPage";
import RFQComparePage from "@/pages/RFQComparePage";
import CustomRequestPage from "@/pages/CustomRequestPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AccountPage from "@/pages/AccountPage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

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
  const { data: me, isLoading } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  if (!token) {
    return <Redirect to="/login" />;
  }
  // Don't flash the dashboard before we know whether onboarding is done.
  if (isLoading) return null;
  if (me?.company && me.company.onboarding_completed === false) {
    return <Redirect to="/onboarding" />;
  }

  return (
    <DashboardLayout>
      <Component {...rest} />
    </DashboardLayout>
  );
}

function OnboardingRoute() {
  const token = localStorage.getItem("mwrd_token");
  if (!token) return <Redirect to="/login" />;
  return <OnboardingPage />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/onboarding" component={OnboardingRoute} />

      {/* Protected Routes */}
      <Route path="/">
        {(params) => <ProtectedRoute component={DashboardPage} path="/" {...params} />}
      </Route>
      <Route path="/catalog/categories/:slug">
        {(params) => <ProtectedRoute component={CategoryDetailPage} path="/catalog/categories/:slug" {...params} />}
      </Route>
      <Route path="/catalog/products/:id">
        {(params) => <ProtectedRoute component={ProductDetailPage} path="/catalog/products/:id" {...params} />}
      </Route>
      <Route path="/catalog/bundles/:slug">
        {(params) => <ProtectedRoute component={BundleDetailPage} path="/catalog/bundles/:slug" {...params} />}
      </Route>
      <Route path="/catalog/bundles">
        {(params) => <ProtectedRoute component={BundlesPage} path="/catalog/bundles" {...params} />}
      </Route>
      <Route path="/catalog">
        {(params) => <ProtectedRoute component={CatalogPage} path="/catalog" {...params} />}
      </Route>
      <Route path="/cart/saved">
        {(params) => <ProtectedRoute component={SavedCartsPage} path="/cart/saved" {...params} />}
      </Route>
      <Route path="/cart">
        {(params) => <ProtectedRoute component={CartPage} path="/cart" {...params} />}
      </Route>
      <Route path="/rfqs">
        {(params) => <ProtectedRoute component={RFQsPage} path="/rfqs" {...params} />}
      </Route>
      <Route path="/rfqs/new/custom">
        {(params) => <ProtectedRoute component={CustomRequestPage} path="/rfqs/new/custom" {...params} />}
      </Route>
      <Route path="/rfqs/:id/compare">
        {(params) => <ProtectedRoute component={RFQComparePage} path="/rfqs/:id/compare" {...params} />}
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
        <Redirect to="/account/users" />
      </Route>
      <Route path="/account/users">
        {(params) => <ProtectedRoute component={AccountPage} path="/account/users" {...params} />}
      </Route>
      <Route path="/account/roles">
        {(params) => <ProtectedRoute component={AccountPage} path="/account/roles" {...params} />}
      </Route>
      <Route path="/account/approval-tree">
        {(params) => <ProtectedRoute component={AccountPage} path="/account/approval-tree" {...params} />}
      </Route>
      <Route path="/account/addresses">
        {(params) => <ProtectedRoute component={AccountPage} path="/account/addresses" {...params} />}
      </Route>
      <Route path="/account/billing">
        {(params) => <ProtectedRoute component={AccountPage} path="/account/billing" {...params} />}
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
