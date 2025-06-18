import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import CustomizePizza from './CustomizePizza';
import PaymentPage from './PaymentPage';
import UserProfile from './UserProfile';
import Orders from './Orders';
import AdminDashboard from './components/AdminDashboard';
import AuthCallback from './components/AuthCallback';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();

  const router = createBrowserRouter([
    {
      path: "/signup",
      element: !isAuthenticated ? <SignUp /> : <Navigate to="/" />
    },
    {
      path: "/login",
      element: !isAuthenticated ? <Login /> : <Navigate to="/" />
    },
    {
      path: "/",
      element: <Home />
    },
    {
      path: "/customize-pizza",
      element: <CustomizePizza />
    },
    {
      path: "/payment",
      element: <PaymentPage />
    },
    {
      path: "/profile",
      element: isAuthenticated ? <UserProfile /> : <Navigate to="/login" />
    },
    {
      path: "/orders",
      element: isAuthenticated ? <Orders /> : <Navigate to="/login" />
    },
    {
      path: "/orders/:orderId",
      element: isAuthenticated ? <Orders /> : <Navigate to="/login" />
    },
    {
      path: "/admin",
      element: isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />
    },
    {
      path: "/auth/callback",
      element: <AuthCallback />
    },
    {
      path: "*",
      element: <Navigate to="/" />
    }
  ], {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true
    }
  });

  return <RouterProvider router={router} />;
}

export default App;
