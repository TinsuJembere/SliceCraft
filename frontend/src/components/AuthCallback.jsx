import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        login(token, decodedUser);

        // Redirect based on user role
        if (decodedUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        navigate('/login');
      }
    } else {
      // Handle cases where there's no token
      console.error('No token found in callback.');
      navigate('/login');
    }
  }, [location, login, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p>Loading, please wait...</p>
    </div>
  );
};

export default AuthCallback;
