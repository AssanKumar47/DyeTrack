import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { OrderItem } from '@/types/order';

// Available fabric types and colors for new orders
const fabricTypes = ['Cotton', 'Silk', 'Polyester', 'Linen', 'Wool'];
const fabricColors = ['Blue', 'Red', 'Green', 'Purple', 'Yellow', 'Black', 'White', 'Gold', 'Silver'];

interface CreateOrderFormProps {
  onSubmit: (items: OrderItem[], notes: string) => void;
  onCancel: () => void;
  calculateTotal: (items: OrderItem[]) => number;
  isSubmitting?: boolean;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ 
  onSubmit, 
  onCancel, 
  calculateTotal,
  isSubmitting = false 
}) => {
  const [items, setItems] = useState<OrderItem[]>([
    { fabric: 'Cotton', color: 'Blue', quantity: 0, unit: 'meters' }
  ]);
  const [notes, setNotes] = useState('');

  const addOrderItem = () => {
    setItems([
      ...items,
      { fabric: 'Cotton', color: 'Blue', quantity: 0, unit: 'meters' }
    ]);
  };

  const removeOrderItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });

    setItems(updatedItems);
  };

  const handleCreateOrder = () => {
    onSubmit(items, notes);
  };

  // Provide a fallback implementation of calculateTotal if it's not a function
  const getTotal = () => {
    if (typeof calculateTotal === 'function') {
      return calculateTotal(items);
    } else {
      // Fallback calculation if calculateTotal is not provided
      return items.reduce((sum, item) => {
        const basePricing = {
          'Cotton': 5,
          'Silk': 12,
          'Linen': 8,
          'Wool': 10,
          'Polyester': 4
        };
        const price = basePricing[item.fabric] || 6;
        return sum + (price * item.quantity);
      }, 0);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">Order Items</h3>
          <Button
            type="button"
            size="sm"
            onClick={addOrderItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg">
            <div className="col-span-4 space-y-1">
              <Label htmlFor={`fabric-${index}`}>Fabric</Label>
              <Select
                value={item.fabric}
                onValueChange={(value) => updateOrderItem(index, 'fabric', value)}
              >
                <SelectTrigger id={`fabric-${index}`}>
                  <SelectValue placeholder="Select fabric" />
                </SelectTrigger>
                <SelectContent>
                  {fabricTypes.map((fabric) => (
                    <SelectItem key={fabric} value={fabric}>
                      {fabric}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3 space-y-1">
              <Label htmlFor={`color-${index}`}>Color</Label>
              <Select
                value={item.color}
                onValueChange={(value) => updateOrderItem(index, 'color', value)}
              >
                <SelectTrigger id={`color-${index}`}>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {fabricColors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor={`quantity-${index}`}>Quantity</Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor={`unit-${index}`}>Unit</Label>
              <Input
                id={`unit-${index}`}
                value={item.unit}
                disabled
              />
            </div>

            <div className="col-span-1 flex items-center justify-center">
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOrderItem(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Special Instructions</Label>
        <Input
          id="notes"
          placeholder="Any special requirements or notes for your order"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Order Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium mb-2">Order Summary</h3>
        {items.length > 0 ? (
          <>
            <ul className="space-y-2 mb-4">
              {items.map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{item.fabric} - {item.color}, {item.quantity} {item.unit}</span>
                  <span>Rs.{(getTotal() / items.length).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total:</span>
              <span>Rs.{getTotal().toFixed(2)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Add items to see the order summary</p>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Estimated Total:</span>
          <span className="font-bold text-lg">Rs.{getTotal().toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Final price may vary based on actual material usage and processing.
        </p>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateOrder} 
          className="bg-dye-600 hover:bg-dye-700"
          disabled={items.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Creating Order...' : 'Create Order'}
        </Button>
      </div>
    </div>
  );
};

export default CreateOrderForm;
