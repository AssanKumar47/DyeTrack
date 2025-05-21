
export type OrderItem = {
  fabric: string;
  color: string;
  quantity: number;
  unit: string;
};

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';

export type StatusHistoryItem = {
  status: OrderStatus;
  date: Date;
  note: string;
};

export type Order = {
  id: string;
  trackingNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  estimatedDelivery: Date;
  deliveredAt?: Date;
  notes: string;
  statusHistory: StatusHistoryItem[];
};
