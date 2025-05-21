import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Box, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// Simple mock data for fallback
const mockData = {
  orders: [
    { name: 'Jan', orders: 12 },
    { name: 'Feb', orders: 19 },
    { name: 'Mar', orders: 22 },
  ],
  inventory: [
    { name: 'Blue Dye', inStock: 50, threshold: 10 },
    { name: 'Red Dye', inStock: 35, threshold: 8 },
    { name: 'Cotton', inStock: 200, threshold: 50 },
  ],
  orderStatus: [
    { name: 'Pending', value: 4 },
    { name: 'Processing', value: 12 },
    { name: 'Ready', value: 6 },
    { name: 'Completed', value: 28 },
  ],
  stats: {
    totalOrders: 50,
    activeOrders: 22,
    lowInventory: 2,
    staffCount: 3
  }
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState(mockData.stats);
  const [ordersData, setOrdersData] = useState(mockData.orders);
  const [inventoryData, setInventoryData] = useState(mockData.inventory);
  const [orderStatusData, setOrderStatusData] = useState(mockData.orderStatus);

  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmounting

    // Function to make request using XMLHttpRequest instead of fetch
    function makeRequest(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'json';
        
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
        
        xhr.send();
      });
    }
    
    async function fetchData() {
      if (!isMounted) return;
      
      try {
        let newStats = {...mockData.stats};
        let newOrdersData = [...mockData.orders];
        let newInventoryData = [...mockData.inventory];
        let newOrderStatusData = [...mockData.orderStatus];
        
        try {
          console.log('Checking server connection...');
          const serverData = await makeRequest('http://localhost:5000/');
          console.log('Server connection successful');
          
          console.log('Fetching orders...');
          const orders = await makeRequest('http://localhost:5000/api/orders');
          console.log('Orders fetch successful:', orders.length, 'orders');
          
          if (orders && orders.length) {
            const activeOrders = orders.filter(o => o.status !== 'completed').length || 0;
            const pending = orders.filter(o => o.status === 'pending').length || 0;
            const processing = orders.filter(o => o.status === 'processing').length || 0;
            const ready = orders.filter(o => o.status === 'ready').length || 0;
            const completed = orders.filter(o => o.status === 'completed').length || 0;
            
            const monthMap = {};
            orders.forEach(order => {
              if (order.createdAt) {
                try {
                  const date = new Date(order.createdAt);
                  const month = date.toLocaleString('default', { month: 'short' });
                  monthMap[month] = (monthMap[month] || 0) + 1;
                } catch (e) {
                  console.warn('Date parsing error:', e);
                }
              }
            });
            
            newStats = {
              ...newStats,
              totalOrders: orders.length,
              activeOrders
            };
            
            newOrdersData = Object.keys(monthMap).map(month => ({
              name: month,
              orders: monthMap[month]
            }));
            
            newOrderStatusData = [
              { name: 'Pending', value: pending },
              { name: 'Processing', value: processing },
              { name: 'Ready', value: ready },
              { name: 'Completed', value: completed }
            ];
          }
          
          console.log('Fetching inventory...');
          const inventory = await makeRequest('http://localhost:5000/api/inventory');
          console.log('Inventory fetch successful:', inventory.length, 'items');
          
          if (inventory && inventory.length) {
            const lowItems = inventory.filter(item => 
              item.quantity !== undefined && 
              item.threshold !== undefined && 
              item.quantity <= item.threshold
            );
            
            newStats = {
              ...newStats,
              lowInventory: lowItems.length
            };
            
            newInventoryData = inventory.slice(0, 5).map(item => ({
              name: item.name,
              inStock: item.quantity,
              threshold: item.threshold || 0
            }));
          }
          
          console.log('Fetching staff...');
          const staff = await makeRequest('http://localhost:5000/api/staff');
          console.log('Staff fetch successful:', staff.length, 'members');
          
          if (staff && staff.length) {
            const activeStaff = staff.filter(member => member.status === 'active').length || 0;
            
            newStats = {
              ...newStats,
              staffCount: activeStaff
            };
          }
          
          if (isMounted) {
            setStats(newStats);
            setOrdersData(newOrdersData);
            setInventoryData(newInventoryData);
            setOrderStatusData(newOrderStatusData);
            setError(null);
          }
        } catch (requestError) {
          console.error('API request failed:', requestError);
          if (isMounted) {
            setError(requestError.message || "Connection error");
          }
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        if (isMounted) {
          setError("An unexpected error occurred");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
        
        {error && (
          <div className="p-2 bg-red-50 text-red-800 rounded-md mb-4">
            <p>Error: {error}</p>
            <p>Using mock data instead</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">All time orders</p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Low Inventory</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.lowInventory}</div>
                  <p className="text-xs text-muted-foreground">Items below threshold</p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.staffCount}</div>
                  <p className="text-xs text-muted-foreground">Active employees</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Orders</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={ordersData}
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
                      <Area type="monotone" dataKey="orders" stroke="#7c3aed" fill="#c4b5fd" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={orderStatusData}
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
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p>Loading inventory data...</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={inventoryData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="inStock" stroke="#8b5cf6" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
