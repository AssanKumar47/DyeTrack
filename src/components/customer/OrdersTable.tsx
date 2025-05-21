
import React from 'react';
import { Order } from '@/types/order';
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Truck } from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onTrackOrder: (order: Order) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ 
  orders, 
  sortField, 
  sortDirection, 
  handleSort,
  onTrackOrder
}) => {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-processing';
      case 'ready':
        return 'badge-info';
      case 'completed':
        return 'badge-success';
      default:
        return 'badge-info';
    }
  };

  return (
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
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('status')}>
                Status
                {sortField === 'status' && (
                  sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th className="table-header-cell">
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('createdAt')}>
                Order Date
                {sortField === 'createdAt' && (
                  sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th className="table-header-cell">
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('estimatedDelivery')}>
                Est. Delivery
                {sortField === 'estimatedDelivery' && (
                  sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </th>
            <th className="table-header-cell">Action</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {orders.map((order) => (
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
              <td className="table-cell">Rs.{order.totalAmount.toFixed(2)}</td>
              <td className="table-cell">
                <span className={`badge ${getStatusBadge(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </td>
              <td className="table-cell">{order.createdAt.toLocaleDateString()}</td>
              <td className="table-cell">{order.estimatedDelivery.toLocaleDateString()}</td>
              <td className="table-cell">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTrackOrder(order)}
                  className="flex items-center"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Track
                </Button>
              </td>
            </tr>
          ))}
          
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                No orders found. Create a new order to get started!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
