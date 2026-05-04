import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import RFQsPage from "@/pages/RFQsPage";
import RFQDetailPage from "@/pages/RFQDetailPage";
import QuotesPage from "@/pages/QuotesPage";
import QuoteDetailPage from "@/pages/QuoteDetailPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import OffersPage from "@/pages/OffersPage";
import CreateOfferPage from "@/pages/CreateOfferPage";
import ProductRequestsPage from "@/pages/ProductRequestsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AccountPage from "@/pages/AccountPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ActivatePage from "@/pages/ActivatePage";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const token = localStorage.getItem("mwrd_supplier_token");
  const { data: me, isLoading } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
  });

  if (!token) return <Redirect to="/login" />;
  if (isLoading) return null;
  if (me?.company && me.company.onboarding_completed === false) {
    return <Redirect to="/onboarding" />;
  }
  return <Component />;
}

function OnboardingRoute() {
  const token = localStorage.getItem("mwrd_supplier_token");
  if (!token) return <Redirect to="/login" />;
  return <OnboardingPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/activate" component={ActivatePage} />
      <Route path="/onboarding" component={OnboardingRoute} />

      <Route path="/">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/rfqs">
        {() => <ProtectedRoute component={RFQsPage} />}
      </Route>
      <Route path="/rfqs/:id">
        {() => <ProtectedRoute component={RFQDetailPage} />}
      </Route>
      <Route path="/quotes">
        {() => <ProtectedRoute component={QuotesPage} />}
      </Route>
      <Route path="/quotes/:id">
        {() => <ProtectedRoute component={QuoteDetailPage} />}
      </Route>
      <Route path="/orders">
        {() => <ProtectedRoute component={OrdersPage} />}
      </Route>
      <Route path="/orders/:id">
        {() => <ProtectedRoute component={OrderDetailPage} />}
      </Route>
      <Route path="/offers">
        {() => <ProtectedRoute component={OffersPage} />}
      </Route>
      <Route path="/offers/new">
        {() => <ProtectedRoute component={CreateOfferPage} />}
      </Route>
      <Route path="/product-requests">
        {() => <ProtectedRoute component={ProductRequestsPage} />}
      </Route>
      <Route path="/notifications">
        {() => <ProtectedRoute component={NotificationsPage} />}
      </Route>
      <Route path="/account">
        {() => <ProtectedRoute component={AccountPage} />}
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
