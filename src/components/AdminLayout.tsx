
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Package, 
  Box, 
  Users, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Orders', path: '/admin/orders', icon: <Package className="w-5 h-5" /> },
    { name: 'Inventory', path: '/admin/inventory', icon: <Box className="w-5 h-5" /> },
    { name: 'Staff', path: '/admin/staff', icon: <Users className="w-5 h-5" /> },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white dark:bg-gray-800 shadow-md"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo and company name */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-dye-600 rounded-full flex items-center justify-center">
                <Box className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-dye-800 dark:text-dye-200">DyeTrack</span>
            </div>
          </div>
          
          {/* User info */}
          <div className="flex flex-col items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-12 w-12 bg-dye-100 dark:bg-dye-900 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-dye-800 dark:text-dye-200">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="mt-2 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-dye-100 text-dye-700 dark:bg-dye-900 dark:text-dye-200' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Logout button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="ghost" 
              onClick={logout} 
              className="w-full flex items-center justify-center text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
