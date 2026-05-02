import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={DashboardPage} />
      <Route path="/rfqs" component={RFQsPage} />
      <Route path="/rfqs/:id" component={RFQDetailPage} />
      <Route path="/quotes" component={QuotesPage} />
      <Route path="/quotes/:id" component={QuoteDetailPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/orders/:id" component={OrderDetailPage} />
      <Route path="/offers" component={OffersPage} />
      <Route path="/offers/new" component={CreateOfferPage} />
      <Route path="/product-requests" component={ProductRequestsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/account" component={AccountPage} />
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
