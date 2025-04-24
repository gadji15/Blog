import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import HomePage from "@/pages/home-page";
import FilmsPage from "@/pages/films-page";
import SeriesPage from "@/pages/series-page";
import SearchPage from "@/pages/search-page";
import ContentDetailsPage from "@/pages/content-details-page";
import PlayerPage from "@/pages/player-page";
import AuthPage from "@/pages/auth-page";
import MyListPage from "@/pages/my-list-page";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";

// Legal Pages
import TermsPage from "@/pages/legal/terms-page";
import PrivacyPage from "@/pages/legal/privacy-page";
import CookiesPage from "@/pages/legal/cookies-page";

// Layout
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Protected Routes
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/films" component={FilmsPage} />
      <Route path="/series" component={SeriesPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/content/:id" component={ContentDetailsPage} />
      <Route path="/player/:id" component={PlayerPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/my-list" component={MyListPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      
      {/* Legal Pages */}
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/cookies" component={CookiesPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Header />
      <main className="min-h-screen pt-20">
        <Router />
      </main>
      <Footer />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
