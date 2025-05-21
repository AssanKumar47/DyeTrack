
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      // Redirect based on user role
      const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
      navigate(redirectPath);
    } else {
      // Redirect to login page if not authenticated
      navigate('/login');
    }
  }, [navigate, isAuthenticated, user, loading]);

  return <LoadingSpinner />;
};

export default Index;
