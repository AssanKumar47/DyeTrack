import React, { useState } from 'react';
import CustomerLayout from '@/components/CustomerLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Plus, Search, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from '@/types/order';
import { useOrders } from '@/hooks/useOrders';
import OrdersTable from '@/components/customer/OrdersTable';
import CreateOrderForm from '@/components/customer/CreateOrderForm';
import OrderTracking from '@/components/customer/OrderTracking';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

const CustomerOrders: React.FC = () => {
  const { user } = useAuth();
  const { 
    loading,
    error,
    searchQuery, 
    setSearchQuery, 
    sortField, 
    sortDirection, 
    filterOrders, 
    handleSort,
    calculateTotal,
    createOrder
  } = useOrders(user?.name);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openTrackingDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsTrackingDialogOpen(true);
  };

  const handleCreateOrder = async (items: any[], notes: string) => {
    if (items.length === 0) {
      toast.error("Please add at least one item to your order");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder(items, notes);
      if (result) {
        toast.success("Order created successfully!");
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = filterOrders();

  return (
    <CustomerLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Package className="mr-2 h-6 w-6" />
            Your Orders
          </h1>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-dye-600 hover:bg-dye-700">
            <Plus className="mr-2 h-4 w-4" />
            Create New Order
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-50 text-red-800 rounded-md mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by tracking number or status..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Orders table with loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-dye-600" />
            <span className="ml-2 text-lg">Loading your orders...</span>
          </div>
        ) : filteredOrders.length > 0 ? (
          <OrdersTable
            orders={filteredOrders}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            onTrackOrder={openTrackingDialog}
          />
        ) : (
          <div className="text-center p-10 bg-gray-50 rounded-md">
            <p className="text-lg text-gray-600">You don't have any orders yet.</p>
            <p className="text-gray-500 mt-1">Click "Create New Order" to place your first order.</p>
          </div>
        )}
      </div>

      {/* Create Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Please specify the details for your dyeing order.
            </DialogDescription>
          </DialogHeader>

          <CreateOrderForm 
            onSubmit={handleCreateOrder}
            onCancel={() => setIsCreateDialogOpen(false)}
            calculateTotal={calculateTotal}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Order Tracking Dialog */}
      {selectedOrder && (
        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Order Tracking</DialogTitle>
              <DialogDescription>
                Tracking Number: {selectedOrder.trackingNumber}
              </DialogDescription>
            </DialogHeader>

            <OrderTracking 
              order={selectedOrder} 
              onClose={() => setIsTrackingDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </CustomerLayout>
  );
};

export default CustomerOrders;
