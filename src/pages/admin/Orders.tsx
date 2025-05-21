import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Search, Calendar, ArrowUp, ArrowDown, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/components/ui/sonner';
import { Order, OrderStatus, StatusHistoryItem } from '@/types/order';
import { useOrders } from '@/hooks/useOrders';

// Order status options with their corresponding badge classes
const orderStatusOptions = [
  { value: 'pending', label: 'Pending', badgeClass: 'badge-warning' },
  { value: 'processing', label: 'Processing', badgeClass: 'badge-processing' },
  { value: 'ready', label: 'Ready', badgeClass: 'badge-info' },
  { value: 'completed', label: 'Completed', badgeClass: 'badge-success' },
  { value: 'cancelled', label: 'Cancelled', badgeClass: 'badge-danger' },
];

const AdminOrders: React.FC = () => {
  // Use the shared useOrders hook
  const { 
    orders, 
    loading, 
    error, 
    setSearchQuery, 
    handleSort, 
    sortField, 
    sortDirection, 
    filterOrders, 
    updateOrderStatus 
  } = useOrders();
  
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');

  // Apply additional filters (status and date)
  const getFilteredOrders = () => {
    let filtered = filterOrders();

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply date filters
    if (startDate) {
      const startDateObj = new Date(startDate);
      filtered = filtered.filter((order) => new Date(order.createdAt) >= startDateObj);
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); // End of the day
      filtered = filtered.filter((order) => new Date(order.createdAt) <= endDateObj);
    }

    return filtered;
  };

  const handleUpdateStatus = () => {
    if (!selectedOrder || !editStatus) return;

    // Use the updateOrderStatus function from useOrders hook
    updateOrderStatus(selectedOrder.id, editStatus as OrderStatus);
    toast.success(`Order ${selectedOrder.trackingNumber} status updated to ${editStatus}`);
    setSelectedOrder(null);
  };

  const filteredOrders = getFilteredOrders();

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Package className="mr-2 h-6 w-6" />
            Orders Management
          </h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-50 text-red-800 rounded-md mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Search and filter section */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by tracking number or customer..."
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {orderStatusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date filters */}
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
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatusFilter(null);
              setSearchQuery('');
            }}
          >
            Reset Filters
          </Button>
        </div>

        {/* Orders table with loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-dye-600" />
            <span className="ml-2 text-lg">Loading orders...</span>
          </div>
        ) : (
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
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('customerName')}>
                      Customer
                      {sortField === 'customerName' && (
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
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('status')}>
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('createdAt')}>
                      Date
                      {sortField === 'createdAt' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">Action</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredOrders.map((order) => {
                  // Find the badge class for this status
                  const statusBadge = orderStatusOptions.find(opt => opt.value === order.status)?.badgeClass || 'badge-info';
                  
                  return (
                    <tr key={order.id} className="table-row">
                      <td className="table-cell font-medium">{order.trackingNumber}</td>
                      <td className="table-cell">{order.customerName}</td>
                      <td className="table-cell">
                        <div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {item.fabric} - {item.color}, {item.quantity} {item.unit}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="table-cell">Rs.{order.totalAmount.toFixed(2)}</td>
                      <td className="table-cell">
                        <span className={`badge ${statusBadge}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {order.createdAt.toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setEditStatus(order.status);
                              }}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          {selectedOrder && selectedOrder.id === order.id && (
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                                <DialogDescription>
                                  Tracking Number: {selectedOrder.trackingNumber}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div>
                                    <p className="text-sm font-semibold">Customer:</p>
                                    <p>{selectedOrder.customerName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">Total Amount:</p>
                                    <p>Rs.{selectedOrder.totalAmount.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">Order Date:</p>
                                    <p>{selectedOrder.createdAt.toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">Est. Delivery:</p>
                                    <p>{selectedOrder.estimatedDelivery.toLocaleDateString()}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-semibold">Items:</p>
                                  <ul className="list-disc list-inside pl-2">
                                    {selectedOrder.items.map((item, idx) => (
                                      <li key={idx}>
                                        {item.fabric} - {item.color}, {item.quantity} {item.unit}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold">Status History:</p>
                                    <div className="max-h-32 overflow-y-auto border rounded p-2">
                                      {selectedOrder.statusHistory.map((history, idx) => (
                                        <div key={idx} className="py-1 border-b last:border-b-0">
                                          <div className="flex justify-between text-xs">
                                            <span className="font-medium capitalize">{history.status}</span>
                                            <span className="text-gray-500">{new Date(history.date).toLocaleString()}</span>
                                          </div>
                                          <p className="text-xs text-gray-700">{history.note}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">Update Status:</p>
                                  <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {orderStatusOptions.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateStatus}>
                                  Update Status
                                </Button>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No orders found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
