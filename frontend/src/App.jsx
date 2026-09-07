import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import Items from './components/dashboard/Items';
import Users from './components/dashboard/Users';
import Profile from './components/dashboard/Profile';
import Cart from './components/cart/Cart';
import Checkout from './components/cart/Checkout';
import AdminControlCenter from './components/admin/AdminControlCenter';
import NotFound from './components/ui/NotFound';
import LoadingScreen from './components/ui/LoadingScreen';

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function PrivateRoute({ children, allowedRoles, requiredPermission }) {
  const { isAuthenticated, loading, user } = useAuth();
  
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
        
        <Route element={
          <PrivateRoute>
            <Layout />
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
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;