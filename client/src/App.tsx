import React from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from './hooks/use-auth';

// Pages
import HomePage from './pages/home';
import NotFound from './pages/not-found';
import ProfilePage from './pages/profile';
import ContentPage from './pages/content';
import SearchPage from './pages/search';
import MoviesPage from './pages/movies';
import SeriesPage from './pages/series';
import AuthPage from './pages/auth';
import PlansPage from './pages/plans';
import AdminPage from './pages/admin';

// Components
import { MainLayout } from './components/layouts/main-layout';

// Route guard
const PrivateRoute = ({ component: Component, adminOnly = false, ...rest }: any) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

export default function App() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login">
          <AuthPage mode="login" />
        </Route>
        <Route path="/register">
          <AuthPage mode="register" />
        </Route>
        <Route path="/profile">
          <PrivateRoute component={ProfilePage} />
        </Route>
        <Route path="/content/:id">
          {(params) => <ContentPage id={parseInt(params.id)} />}
        </Route>
        <Route path="/search">
          <SearchPage />
        </Route>
        <Route path="/movies">
          <MoviesPage />
        </Route>
        <Route path="/series">
          <SeriesPage />
        </Route>
        <Route path="/plans">
          <PlansPage />
        </Route>
        <Route path="/admin">
          <PrivateRoute component={AdminPage} adminOnly={true} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}