import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { toast } from '@/components/ui/sonner';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Function to make XMLHttpRequest (to avoid fetch recursion issues)
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

export const useOrders = (customerName?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calculate total order price
  const calculateTotal = useCallback((items: any[]) => {
    // Define pricing for different fabric types
    const fabricPricing = {
      'Cotton': 5,  // $5 per unit
      'Silk': 12,   // $12 per unit
      'Linen': 8,   // $8 per unit
      'Wool': 10,   // $10 per unit
      'Polyester': 4, // $4 per unit
      'Denim': 7,   // $7 per unit
      'Velvet': 15  // $15 per unit
    };

    // Calculate total price based on fabric type and quantity
    return items.reduce((total, item) => {
      const fabricPrice = fabricPricing[item.fabric] || 6; // Default to $6 if fabric not found
      return total + (fabricPrice * item.quantity);
    }, 0);
  }, []);

  // Fetch orders from MongoDB - ensuring we filter by customer name if provided
  useEffect(() => {
    let isMounted = true;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        if (customerName) {
          console.log(`Fetching orders for customer: ${customerName}`);
        } else {
          console.log('Fetching all orders (admin mode)');
        }
        
        // Fetch all orders first
        const allOrders = await makeRequest(`${API_BASE_URL}/orders`);
        
        if (!isMounted) return;
        
        // Filter orders based on customer name if provided
        let filteredOrders = allOrders;
        if (customerName) {
          filteredOrders = allOrders.filter((order: any) => 
            order.customerName === customerName
          );
          console.log(`Filtered ${allOrders.length} orders to ${filteredOrders.length} for ${customerName}`);
        }
        
        // Format the data
        const formattedOrders = filteredOrders.map((order: any) => ({
          ...order,
          id: order._id,
          createdAt: new Date(order.createdAt),
          estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : new Date(),
          statusHistory: order.statusHistory?.map((item: any) => ({
            ...item,
            date: new Date(item.date)
          })) || []
        }));
        
        setOrders(formattedOrders);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load orders');
          toast.error('Failed to load orders');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    
    return () => {
      isMounted = false;
    };
  }, [customerName]);

  // Filter orders based on search query
  const filterOrders = useCallback(() => {
    if (!orders || !orders.length) return [];
    
    let filtered = [...orders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.trackingNumber?.toLowerCase().includes(query)) ||
          (order.customerName?.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const fieldA = a[sortField as keyof typeof a];
      const fieldB = b[sortField as keyof typeof b];
      
      if (fieldA instanceof Date && fieldB instanceof Date) {
        return sortDirection === 'asc'
          ? fieldA.getTime() - fieldB.getTime()
          : fieldB.getTime() - fieldA.getTime();
      }
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc'
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc'
          ? fieldA - fieldB
          : fieldB - fieldA;
      }
      
      return 0;
    });

    return filtered;
  }, [orders, searchQuery, sortField, sortDirection]);

  // Handle sort changes
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Update order status to MongoDB
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      setLoading(true);
      
      // Add a status note
      const statusNote = `Status updated to ${newStatus}`;
      
      // Send update to MongoDB API
      await makeRequest(`${API_BASE_URL}/orders/${orderId}`, 'PUT', {
        status: newStatus,
        statusNote: statusNote
      });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            // Create a new status history entry
            const newHistoryItem = {
              status: newStatus,
              date: new Date(),
              note: statusNote
            };
            
            // Update the order with new status and history
            return {
              ...order,
              status: newStatus,
              statusHistory: [...(order.statusHistory || []), newHistoryItem]
            };
          }
          return order;
        })
      );
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new order - using the customer name provided
  const createOrder = useCallback(async (items: any[], notes: string) => {
    try {
      // Validation
      if (!items || items.length === 0) {
        throw new Error('Please add at least one item to your order');
      }
      
      if (!customerName) {
        throw new Error('Customer name is required to create an order');
      }
      
      const totalAmount = calculateTotal(items);
      
      // Create order data
      const newOrder = {
        customerName: customerName,
        items,
        totalAmount,
        notes,
        status: 'pending' as OrderStatus,
        createdAt: new Date(),
        estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        trackingNumber: `DYE${Math.floor(10000 + Math.random() * 90000)}`, // Generate random tracking number
      };
      
      console.log('Creating new order:', newOrder);
      
      // Send to API
      const response = await makeRequest(`${API_BASE_URL}/orders`, 'POST', newOrder);
      
      if (!response || !response._id) {
        throw new Error('Failed to create order');
      }
      
      // Format the response and add to local state
      const formattedOrder = {
        ...response,
        id: response._id,
        createdAt: new Date(response.createdAt),
        estimatedDelivery: new Date(response.estimatedDelivery),
        statusHistory: response.statusHistory?.map((item: any) => ({
          ...item,
          date: new Date(item.date)
        })) || []
      };
      
      setOrders(prev => [formattedOrder, ...prev]);
      return formattedOrder;
    } catch (err: any) {
      console.error('Error creating order:', err);
      throw err; // Re-throw so the component can handle it
    }
  }, [customerName, calculateTotal]);

  return {
    orders,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortField,
    sortDirection,
    handleSort,
    filterOrders,
    calculateTotal, // Make sure to include this in the return object
    createOrder
  };
};
