import React, { useState, useEffect } from 'react';
import CustomerLayout from '@/components/CustomerLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Search, ArrowUp, ArrowDown, Calendar, Loader } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Function to make request using XMLHttpRequest (to avoid any fetch recursion issues)
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

const CustomerHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [sortField, setSortField] = useState<string>('deliveredAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch completed orders from MongoDB
  useEffect(() => {
    let isMounted = true;
    
    const fetchCompletedOrders = async () => {
      try {
        setLoading(true);
        
        // Check if user has name
        if (!user?.name) {
          console.log('User not authenticated or has no name, waiting...');
          setLoading(false);
          return;
        }
        
        const customerName = user.name;
        console.log(`Fetching completed orders for customer: ${customerName}`);
        
        // Get all orders first
        const allOrders = await makeRequest(`${API_BASE_URL}/orders`);
        
        if (!isMounted) return;
        
        // Filter for completed orders with matching customer name
        const completedOrders = allOrders.filter(order => 
          order.status === 'completed' && order.customerName === customerName
        );
        
        console.log(`Found ${completedOrders.length} completed orders for ${customerName}`);
        
        // Format the data for the component
        const formattedOrders = completedOrders.map(order => ({
          id: order._id,
          trackingNumber: order.trackingNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: new Date(order.createdAt),
          // Use delivery date from status history or fallback to order completion date
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : 
                      new Date(order.statusHistory?.find(h => h.status === 'completed')?.date || order.createdAt),
          notes: order.notes || '',
          statusHistory: order.statusHistory?.map(item => ({
            ...item,
            date: new Date(item.date)
          })) || []
        }));
        
        setOrders(formattedOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching order history:', err);
        if (isMounted) {
          setError('Failed to fetch order history');
          toast.error('Failed to load your order history');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCompletedOrders();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Filter and sort orders
  const filterOrders = () => {
    let filtered = [...orders];

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.trackingNumber.toLowerCase().includes(query) ||
          order.items.some(item => 
            item.fabric.toLowerCase().includes(query) || 
            item.color.toLowerCase().includes(query)
          )
      );
    }

    // Apply date period filter
    const now = new Date();
    
    if (startDate || endDate) {
      if (startDate) {
        const startDateObj = new Date(startDate);
        filtered = filtered.filter((order) => new Date(order.deliveredAt) >= startDateObj);
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // End of the day
        filtered = filtered.filter((order) => new Date(order.deliveredAt) <= endDateObj);
      }
    } else if (selectedPeriod !== 'all') {
      const periods: Record<string, number> = {
        'last-30': 30,
        'last-90': 90,
        'last-180': 180,
        'last-365': 365
      };
      
      const daysAgo = periods[selectedPeriod] || 0;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter((order) => order.deliveredAt >= cutoffDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let fieldA = a[sortField as keyof typeof a];
      let fieldB = b[sortField as keyof typeof b];
      
      // Convert to comparable values if dates
      if (fieldA instanceof Date) fieldA = fieldA.getTime();
      if (fieldB instanceof Date) fieldB = fieldB.getTime();
      
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const openDetailDialog = (order: any) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const filteredOrders = filterOrders();
  
  // Calculate total spent
  const totalSpent = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <CustomerLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <History className="mr-2 h-6 w-6" />
            Order History
          </h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-50 text-red-800 rounded-md mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Summary card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold">{filteredOrders.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground">Most Recent Order</p>
              <p className="text-lg font-semibold">
                {filteredOrders.length > 0 
                  ? filteredOrders.sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime())[0].deliveredAt.toLocaleDateString() 
                  : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and filter section */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by tracking number or item..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last-30">Last 30 Days</SelectItem>
              <SelectItem value="last-90">Last 90 Days</SelectItem>
              <SelectItem value="last-180">Last 6 Months</SelectItem>
              <SelectItem value="last-365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom date filter */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-end">
          <div className="space-y-1 flex-1">
            <label htmlFor="startDate" className="text-sm font-medium">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="startDate"
                type="date"
                className="pl-9"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPeriod('all'); // Reset the dropdown when custom dates are used
                }}
              />
            </div>
          </div>
          
          <div className="space-y-1 flex-1">
            <label htmlFor="endDate" className="text-sm font-medium">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="endDate"
                type="date"
                className="pl-9"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPeriod('all'); // Reset the dropdown when custom dates are used
                }}
              />
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSearchQuery('');
              setSelectedPeriod('all');
            }}
          >
            Reset Filters
          </Button>
        </div>

        {/* Orders history table with loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-dye-600" />
            <span className="ml-2 text-lg">Loading your order history...</span>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('trackingNumber')}>
                      Tracking #
                      {sortField === 'trackingNumber' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">Items</th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('totalAmount')}>
                      Amount
                      {sortField === 'totalAmount' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('createdAt')}>
                      Ordered On
                      {sortField === 'createdAt' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('deliveredAt')}>
                      Delivered On
                      {sortField === 'deliveredAt' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">Action</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell font-medium">{order.trackingNumber}</td>
                    <td className="table-cell">
                      <div>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            {item.fabric} - {item.color}, {item.quantity} {item.unit}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">${order.totalAmount.toFixed(2)}</td>
                    <td className="table-cell">{order.createdAt.toLocaleDateString()}</td>
                    <td className="table-cell">{order.deliveredAt.toLocaleDateString()}</td>
                    <td className="table-cell">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(order)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No completed orders found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-10 bg-gray-50 rounded-md">
            <p className="text-lg text-gray-600">You don't have any completed orders yet.</p>
            <p className="text-gray-500 mt-1">When your orders are completed, they'll appear here.</p>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Tracking Number: {selectedOrder.trackingNumber}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <div className="space-y-4 py-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-medium">Order Items</h3>
                        <ul className="mt-2 space-y-2">
                          {selectedOrder.items.map((item: any, idx: number) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span>{item.fabric} - {item.color}</span>
                              <span>{item.quantity} {item.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold">${selectedOrder.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <h3 className="font-medium">Order Notes</h3>
                        <p className="text-sm mt-1">
                          {selectedOrder.notes || "No special instructions provided."}
                        </p>
                      </div>

                      <div className="border-t pt-3">
                        <h3 className="font-medium">Order Dates</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Order Date</p>
                            <p className="text-sm">{selectedOrder.createdAt.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Delivery Date</p>
                            <p className="text-sm">{selectedOrder.deliveredAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline">
                <div className="space-y-4 py-4">
                  <div className="relative">
                    {/* Line connecting the steps */}
                    <div className="absolute left-3.5 top-0 h-full w-0.5 bg-gray-200"></div>
                    
                    {/* Timeline entries */}
                    <div className="space-y-6 relative">
                      {selectedOrder.statusHistory.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-start">
                          <div className="h-7 w-7 rounded-full border-2 bg-dye-600 border-dye-600 flex items-center justify-center z-10">
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium capitalize">{entry.status}</h3>
                            <p className="text-sm text-muted-foreground">
                              {entry.date.toLocaleString()}
                            </p>
                            <p className="text-sm mt-1">{entry.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={() => setIsDetailDialogOpen(false)} className="w-full">
              Close
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </CustomerLayout>
  );
};

export default CustomerHistory;
