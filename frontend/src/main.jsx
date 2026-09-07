import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { RouteErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RouteErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </RouteErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
