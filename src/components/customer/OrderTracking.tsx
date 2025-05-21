import React from 'react';
import { Order } from '@/types/order';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";

interface OrderTrackingProps {
  order: Order;
  onClose: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ order, onClose }) => {
  
  const getStatusStepClasses = (status: string, orderStatus: string) => {
    // Define the order of statuses
    const statusOrder = ['pending', 'processing', 'ready', 'completed'];
    const orderIndex = statusOrder.indexOf(orderStatus);
    const statusIndex = statusOrder.indexOf(status);
    
    // If current status is equal or before the order's status, mark as completed
    if (statusIndex <= orderIndex) {
      return 'bg-dye-600 border-dye-600';
    } 
    // Otherwise, mark as incomplete
    else {
      return 'bg-white border-gray-300';
    }
  };

  return (
    <>
      <Tabs defaultValue="status">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4 py-4">
          {/* Status timeline */}
          <div className="relative">
            {/* Line connecting the steps */}
            <div className="absolute left-3.5 top-0 h-full w-0.5 bg-gray-200"></div>
            
            {/* Status steps */}
            <div className="space-y-8 relative">
              <div className="flex items-start">
                <div className={`h-7 w-7 rounded-full border-2 ${getStatusStepClasses('pending', order.status)} flex items-center justify-center z-10`}>
                  {getStatusStepClasses('pending', order.status).includes('bg-dye-600') && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Order Placed</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.createdAt.toLocaleString()}
                  </p>
                  <p className="text-sm mt-1">Your order has been received.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`h-7 w-7 rounded-full border-2 ${getStatusStepClasses('processing', order.status)} flex items-center justify-center z-10`}>
                  {getStatusStepClasses('processing', order.status).includes('bg-dye-600') && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.status === 'processing' || order.status === 'ready' || order.status === 'completed' 
                      ? order.statusHistory.find((h) => h.status === 'processing')?.date.toLocaleString() || 'In progress' 
                      : 'Pending'}
                  </p>
                  <p className="text-sm mt-1">Your fabrics are being dyed.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`h-7 w-7 rounded-full border-2 ${getStatusStepClasses('ready', order.status)} flex items-center justify-center z-10`}>
                  {getStatusStepClasses('ready', order.status).includes('bg-dye-600') && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Ready for Pickup</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.status === 'ready' || order.status === 'completed' 
                      ? order.statusHistory.find((h) => h.status === 'ready')?.date.toLocaleString() || 'Soon' 
                      : 'Pending'}
                  </p>
                  <p className="text-sm mt-1">Your order is ready for pickup.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`h-7 w-7 rounded-full border-2 ${getStatusStepClasses('completed', order.status)} flex items-center justify-center z-10`}>
                  {getStatusStepClasses('completed', order.status).includes('bg-dye-600') && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Completed</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.status === 'completed' 
                      ? order.statusHistory.find((h) => h.status === 'completed')?.date.toLocaleString() || 'Soon' 
                      : 'Pending'}
                  </p>
                  <p className="text-sm mt-1">Your order has been delivered.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm">
              <p><span className="font-medium">Estimated Delivery:</span> {order.estimatedDelivery.toLocaleDateString()}</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <div className="space-y-4 py-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium">Order Items</h3>
                  <ul className="mt-2 space-y-2">
                    {order.items.map((item, idx) => (
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
                    <span className="font-bold">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <h3 className="font-medium">Order Notes</h3>
                  <p className="text-sm mt-1">
                    {order.notes || "No special instructions provided."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={onClose} className="w-full">
        Close
      </Button>
    </>
  );
};

export default OrderTracking;
