import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import NotFound from './components/ui/NotFound';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy load page components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Items = lazy(() => import('./components/dashboard/Items'));
const Users = lazy(() => import('./components/dashboard/Users'));
const Profile = lazy(() => import('./components/dashboard/Profile'));
const Cart = lazy(() => import('./components/cart/Cart'));
const Checkout = lazy(() => import('./components/cart/Checkout'));
const AdminControlCenter = lazy(() => import('./components/admin/AdminControlCenter'));
const AboutUs = lazy(() => import('./components/about/AboutUs'));

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading only during auth check, not during module loading
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function PrivateRoute({ children, allowedRoles, requiredPermission }) {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Show loading only during auth check, not during module loading
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.nivel_acesso)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (requiredPermission && user.permissions?.[requiredPermission] === false) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  const location = useLocation();
  const transitionKey = `${location.pathname}${location.search}`;

  return (
    <div key={transitionKey} className="page-transition">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />
          
          <Route element={<Layout />}>
            <Route path="/sobre" element={<AboutUs />} />
            
            <Route element={
              <PrivateRoute>
                <div />
              </PrivateRoute>
            }>
              <Route path="/dashboard" element={
                <PrivateRoute requiredPermission="dashboard">
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/itens" element={
                <PrivateRoute allowedRoles={['admin', 'funcionario', 'cliente']} requiredPermission="itens">
                  <Items />
                </PrivateRoute>
              } />
              <Route path="/carrinho" element={
                <PrivateRoute requiredPermission="carrinho">
                  <Cart />
                </PrivateRoute>
              } />
              <Route path="/checkout" element={
                <PrivateRoute requiredPermission="checkout">
                  <Checkout />
                </PrivateRoute>
              } />
              <Route path="/usuarios" element={
                <PrivateRoute allowedRoles={['admin']} requiredPermission="usuarios">
                  <Users />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <PrivateRoute allowedRoles={['admin']} requiredPermission="admin">
                  <AdminControlCenter />
                </PrivateRoute>
              } />
              <Route path="/perfil" element={
                <PrivateRoute requiredPermission="perfil">
                  <Profile />
                </PrivateRoute>
              } />
            </Route>
          </Route>
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;