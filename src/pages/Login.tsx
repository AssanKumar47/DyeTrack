import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Box, Package } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'customer'>('customer');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Use XMLHttpRequest instead of fetch to avoid recursion issues
      const loginResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/auth/login`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.responseType = 'json';
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(xhr.response?.message || 'Authentication failed'));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during authentication'));
        };
        
        xhr.send(JSON.stringify({
          username,
          password,
          role
        }));
      });
      
      // Use the auth context's login method to store user info
      const result = await login(
        username, 
        password, 
        role, 
        loginResult.user // Pass the user data from MongoDB
      );
      
      if (result.success && result.redirectTo) {
        toast.success(`Welcome back, ${loginResult.user.name || username}!`);
        navigate(result.redirectTo);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // If already logged in, redirect to appropriate dashboard
  if (isAuthenticated && !loading) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dye-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-5" 
           style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%237E69AB' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E')" }}></div>
      
      <Card className="w-full max-w-md shadow-2xl relative z-10 overflow-hidden border-dye-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dye-400 via-dye-600 to-dye-800"></div>
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-dye-600 rounded-xl flex items-center justify-center shadow-lg">
              {role === 'admin' ? (
                <Box className="h-6 w-6 text-white" />
              ) : (
                <Package className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">DyeTrack</CardTitle>
          <CardDescription>
            Enter your credentials to access the{' '}
            {role === 'admin' ? 'admin' : 'customer'} dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder={role === 'admin' ? 'admin' : 'customer1 or customer2'}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={role === 'admin' ? 'admin123' : 'customer123'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Role</Label>
              <RadioGroup 
                value={role} 
                onValueChange={(value) => setRole(value as 'admin' | 'customer')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="cursor-pointer">Admin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="cursor-pointer">Customer</Label>
                </div>
              </RadioGroup>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-dye-600 hover:bg-dye-700" 
              disabled={loading || isLoggingIn}
            >
              {isLoggingIn ? 'Authenticating...' : 'Login'}
            </Button>
          </form>
        </CardContent>
  
      </Card>
    </div>
  );
};

export default Login;
