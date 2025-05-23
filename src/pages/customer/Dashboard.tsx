import React, { useState, useEffect } from 'react';
import CustomerLayout from '@/components/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, History, Calendar, TrendingUp, Loader } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';


function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`HTTP error! status: ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error'));
    };
    
    if (data) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  });
}

const COLORS = ['#f59e0b', '#6d28d9', '#10b981', '#3b82f6'];

const CustomerDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    activeOrders: 0,
    completedOrders: 0,
    nextDelivery: { days: 0, orderNumber: '' },
    monthlyTrend: 0,
    ordersByMonth: [],
    ordersByStatus: [],
    recentOrders: []
  });

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchDashboardData = async () => {
      try {
        if (authLoading) {
          // Wait for auth to finish loading before trying to fetch data
          console.log('Waiting for authentication to complete...');
          return;
        }
        
        setLoading(true);
        
        // Use customer name for fetching instead of ID
        const customerName = user?.name;
        
        if (!customerName) {
          // If we've retried too many times, show an error
          if (retryCount >= maxRetries) {
            throw new Error('Unable to retrieve user information. Please try logging in again.');
          }
          
          // Retry with a delay
          retryCount++;
          console.log(`Customer name not available yet, retrying (${retryCount}/${maxRetries})...`);
          setTimeout(fetchDashboardData, 1000);
          return;
        }
        
        console.log('Fetching orders for customer:', customerName);
        
        // Fetch all orders and filter by customer name
        const allOrders = await makeRequest(`${API_BASE_URL}/orders`);
        
        if (!isMounted) return;
        
        // Filter orders to only include those for the current customer
        const orders = allOrders.filter(order => order.customerName === customerName);
        console.log(`Filtered ${allOrders.length} orders down to ${orders.length} for ${customerName}`);
        
        // Process the orders to get dashboard data
        const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
        const completedOrders = orders.filter(order => order.status === 'completed');
        
        // Calculate next delivery
        const pendingDeliveries = activeOrders
          .filter(order => order.estimatedDelivery)
          .sort((a, b) => new Date(a.estimatedDelivery) - new Date(b.estimatedDelivery));
        
        let nextDelivery = { days: 0, orderNumber: '' };
        if (pendingDeliveries.length > 0) {
          const deliveryDate = new Date(pendingDeliveries[0].estimatedDelivery);
          const today = new Date();
          const diffTime = deliveryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          nextDelivery = {
            days: diffDays,
            orderNumber: pendingDeliveries[0].trackingNumber
          };
        }
        
        // Calculate monthly trend
        let monthlyTrend = 0;
        if (orders.length > 0) {
          const today = new Date();
          const thisMonth = today.getMonth();
          const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
          const thisYear = today.getFullYear();
          const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
          
          const thisMonthOrders = orders.filter(order => {
            const date = new Date(order.createdAt);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
          }).length;
          
          const lastMonthOrders = orders.filter(order => {
            const date = new Date(order.createdAt);
            return date.getMonth() === lastMonth && date.getFullYear() === lastYear;
          }).length;
          
          if (lastMonthOrders > 0) {
            monthlyTrend = Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100);
          } else if (thisMonthOrders > 0) {
            monthlyTrend = 100; // If no orders last month, but have orders this month
          }
        }
        
        // Calculate orders by month
        const ordersByMonth = [];
        if (orders.length > 0) {
          const monthCounts = {};
          const today = new Date();
          // Get the last 6 months
          for (let i = 5; i >= 0; i--) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            monthCounts[monthName] = 0;
          }
          
          // Count orders per month
          orders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthName = date.toLocaleString('default', { month: 'short' });
            // Only count orders from the last 6 months
            if (monthCounts[monthName] !== undefined) {
              monthCounts[monthName]++;
            }
          });
          
          // Format for chart
          Object.keys(monthCounts).forEach(month => {
            ordersByMonth.push({
              name: month,
              orders: monthCounts[month]
            });
          });
        }
        
        // Calculate orders by status
        const statusCounts = {
          Pending: 0,
          Processing: 0,
          Ready: 0,
          Completed: 0
        };
        
        orders.forEach(order => {
          const status = order.status.charAt(0).toUpperCase() + order.status.slice(1);
          if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
          }
        });
        
        const ordersByStatus = Object.keys(statusCounts).map(status => ({
          name: status,
          value: statusCounts[status]
        })).filter(item => item.value > 0);
        
        // Get recent orders (latest 3)
        const recentOrders = [...orders]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map(order => ({
            id: order._id,
            trackingNumber: order.trackingNumber,
            status: order.status,
            items: order.items,
            estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : null,
            createdAt: new Date(order.createdAt)
          }));
        
        // Update dashboard data
        setDashboardData({
          activeOrders: activeOrders.length,
          completedOrders: completedOrders.length,
          nextDelivery,
          monthlyTrend,
          ordersByMonth: ordersByMonth.length > 0 ? ordersByMonth : [{ name: 'No Data', orders: 0 }],
          ordersByStatus: ordersByStatus.length > 0 ? ordersByStatus : [{ name: 'No Orders', value: 1 }],
          recentOrders
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch dashboard data');
          
          // If this is an authentication error, provide more helpful message
          if (err.message.includes('not authenticated')) {
            setError('You are not properly logged in. Please log out and log in again.');
            toast.error('Authentication issue detected');
          } else {
            toast.error('Failed to load your dashboard');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Only attempt to fetch data if auth isn't still loading
    if (!authLoading) {
      fetchDashboardData();
    }
    
    // If auth is still loading, set up a watcher to fetch data once auth completes
    const authCheckInterval = setInterval(() => {
      if (!authLoading && isMounted) {
        clearInterval(authCheckInterval);
        fetchDashboardData();
      }
    }, 500);
    
    return () => {
      isMounted = false;
      clearInterval(authCheckInterval);
    };
  }, [user, authLoading]);

  return (
    <CustomerLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name || 'Customer'}</h1>
            <p className="text-muted-foreground">Here's an overview of your orders and activities.</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-50 text-red-800 rounded-md mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Show special message for auth loading state */}
        {authLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-dye-600" />
            <span className="ml-2 text-lg">Verifying your account...</span>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-dye-600" />
            <span className="ml-2 text-lg">Loading your dashboard...</span>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                  <Package className="h-4 w-4 text-dye-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                  <History className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.completedOrders}</div>
                  <p className="text-xs text-muted-foreground">Over all time</p>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Next Delivery</CardTitle>
                  <Calendar className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.nextDelivery.orderNumber 
                      ? `${dashboardData.nextDelivery.days} days` 
                      : 'No delivery'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.nextDelivery.orderNumber 
                      ? `Order #${dashboardData.nextDelivery.orderNumber}` 
                      : 'No pending deliveries'}
                  </p>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Trend</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.monthlyTrend > 0 ? `+${dashboardData.monthlyTrend}%` : `${dashboardData.monthlyTrend}%`}</div>
                  <p className="text-xs text-muted-foreground">Orders vs last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders and Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="stat-card">
                <CardHeader>
                  <CardTitle>Orders Over Time</CardTitle>
                  <CardDescription>Number of orders placed per month</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={dashboardData.ordersByMonth}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="#7c3aed" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                  <CardDescription>Distribution of your orders by status</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.ordersByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {dashboardData.ordersByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your recently placed orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentOrders.length > 0 ? (
                    dashboardData.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center">
                        <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-dye-100">
                          <Package className="h-5 w-5 text-dye-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Order #{order.trackingNumber}</p>
                            <span className={`badge badge-${order.status === 'pending' ? 'warning' : 
                              order.status === 'processing' ? 'processing' : 
                              order.status === 'ready' ? 'info' : 
                              order.status === 'completed' ? 'success' : 'danger'}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {order.items.map(item => `${item.fabric} - ${item.color}, ${item.quantity} ${item.unit}`).join(', ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.status === 'completed' 
                              ? `Completed: ${order.createdAt.toLocaleDateString()}`
                              : order.estimatedDelivery
                                ? `Expected delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}`
                                : `Created: ${order.createdAt.toLocaleDateString()}`
                            }
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">You don't have any orders yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
