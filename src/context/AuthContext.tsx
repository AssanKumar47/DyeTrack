import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

export interface User {
  _id: string;
  username: string;
  role: 'admin' | 'customer';
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, role: 'admin' | 'customer') => Promise<{ success: boolean, redirectTo?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Store the original fetch method
    const originalFetch = window.fetch;
    
    // Override fetch to include authentication headers
    window.fetch = async (input, init) => {
      // Get the current token from wherever you store it (localStorage, state, etc.)
      const token = localStorage.getItem('token');
      
      // Create new init object with auth headers if we have a token
      const newInit = init ? { ...init } : {};
      
      if (token) {
        newInit.headers = {
          ...newInit.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      
      // IMPORTANT: Call the original fetch to avoid recursion!
      return originalFetch(input, newInit);
    };
    
    // Cleanup: restore original fetch when component unmounts
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // In a real app, this would make an API call to your server
  const login = async (username: string, password: string, role: 'admin' | 'customer') => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Login failed');
        setLoading(false);
        return { success: false };
      }
      
      const userData = await response.json();
      const loggedInUser = userData.user;
      
      // Store the user in state and localStorage
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      
      toast.success(`Welcome, ${loggedInUser.name}!`);
      
      // Return success with the redirect path instead of navigating here
      const redirectPath = loggedInUser.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
      setLoading(false);
      return { success: true, redirectTo: redirectPath };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
      setLoading(false);
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // We'll handle navigation in the component that calls logout
    toast.success('You have been logged out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Mock authentication for demo purpose (without actual MongoDB connection)
// This function simulates the API endpoint for login
export async function setupMockAuth() {
  // Mock user data
  const mockUsers = [
    {
      _id: '1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User',
      email: 'admin@dyeingcompany.com',
    },
    {
      _id: '2',
      username: 'customer1',
      password: 'customer123',
      role: 'customer',
      name: 'John Doe',
      email: 'john@example.com',
    },
    {
      _id: '3',
      username: 'customer2',
      password: 'customer123',
      role: 'customer',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  ];

  // Create a mock fetch API for login
  window.fetch = async (url, options) => {
    const original = window.fetch;
    
    if (url === '/api/login' && options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      const { username, password, role } = body;
      
      // Find the user
      const user = mockUsers.find(
        (u) => u.username === username && u.password === password && u.role === role
      );
      
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        
        return {
          ok: true,
          json: async () => ({ user: userWithoutPassword }),
        } as Response;
      } else {
        return {
          ok: false,
          json: async () => ({ message: 'Invalid credentials' }),
        } as Response;
      }
    }
    
    // For all other requests, use the original fetch
    return original(url, options);
  };
}
