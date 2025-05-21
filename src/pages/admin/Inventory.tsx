import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Box, Search, Plus, Edit, AlertTriangle, ArrowUp, ArrowDown, Loader } from 'lucide-react';
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

// Inventory categories
const categories = ['All', 'Dye', 'Fabric', 'Chemical', 'Equipment'];

const initialFormState = {
  name: '',
  category: '',
  quantity: '',
  unit: '',
  description: '',
  threshold: '',
};

const AdminInventory: React.FC = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch inventory data from the API
  useEffect(() => {
    let isMounted = true;
    
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await makeRequest(`${API_BASE_URL}/inventory`);
        
        if (isMounted) {
          // Convert to the format our component expects
          const formattedData = data.map(item => ({
            ...item,
            id: item._id,
            lastUpdated: new Date(item.lastUpdated)
          }));
          
          setInventory(formattedData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        if (isMounted) {
          setError('Failed to fetch inventory data');
          toast.error('Failed to load inventory data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInventory();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Search and filter inventory
  const filterInventory = () => {
    let filtered = [...inventory];

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const fieldA = a[sortField as keyof typeof a];
      const fieldB = b[sortField as keyof typeof b];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc'
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      // For numbers and dates
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
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddItem = async () => {
    // Validation
    if (!formData.name || !formData.category || !formData.quantity || !formData.unit || !formData.threshold) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newItem = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      description: formData.description,
      threshold: parseFloat(formData.threshold),
      lastUpdated: new Date(),
    };

    try {
      // Call the API to add the item
      const response = await makeRequest(`${API_BASE_URL}/inventory`, 'POST', newItem);
      
      // Update the local state with the new item from the server
      setInventory([...inventory, { 
        ...response, 
        id: response._id,
        lastUpdated: new Date(response.lastUpdated)
      }]);
      
      toast.success(`${formData.name} added to inventory`);
      setFormData(initialFormState);
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error('Error adding inventory item:', err);
      toast.error('Failed to add inventory item');
    }
  };

  const handleEditItem = async () => {
    if (!selectedItem || !formData.name || !formData.category || !formData.quantity || !formData.unit || !formData.threshold) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedItem = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      description: formData.description,
      threshold: parseFloat(formData.threshold),
      lastUpdated: new Date(),
    };

    try {
      // Call the API to update the item
      await makeRequest(`${API_BASE_URL}/inventory/${selectedItem._id || selectedItem.id}`, 'PUT', updatedItem);
      
      // Update the local state
      const updatedInventory = inventory.map((item) => {
        if (item.id === selectedItem.id || item._id === selectedItem._id) {
          return {
            ...item,
            ...updatedItem,
            lastUpdated: new Date(),
          };
        }
        return item;
      });

      setInventory(updatedInventory);
      toast.success(`${formData.name} updated successfully`);
      setFormData(initialFormState);
      setSelectedItem(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating inventory item:', err);
      toast.error('Failed to update inventory item');
    }
  };

  const startEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      description: item.description || '',
      threshold: item.threshold.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const filteredInventory = filterInventory();

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Box className="mr-2 h-6 w-6" />
            Inventory Management
          </h1>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-dye-600 hover:bg-dye-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
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
              placeholder="Search inventory..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
            }}
          >
            Reset Filters
          </Button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-dye-600" />
            <span className="ml-2 text-lg">Loading inventory...</span>
          </div>
        ) : (
          /* Inventory table */
          <div className="table-container">
            <table className="data-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('name')}>
                      Name
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('category')}>
                      Category
                      {sortField === 'category' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('quantity')}>
                      Quantity
                      {sortField === 'quantity' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">Description</th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('threshold')}>
                      Threshold
                      {sortField === 'threshold' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('lastUpdated')}>
                      Last Updated
                      {sortField === 'lastUpdated' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">Action</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredInventory.map((item) => {
                  const isLowStock = item.quantity <= item.threshold;
                  
                  return (
                    <tr key={item.id || item._id} className="table-row">
                      <td className="table-cell font-medium">{item.name}</td>
                      <td className="table-cell">{item.category}</td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          {isLowStock && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-1.5" />
                          )}
                          <span className={isLowStock ? 'text-amber-600 font-medium' : ''}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">{item.description}</td>
                      <td className="table-cell">{item.threshold} {item.unit}</td>
                      <td className="table-cell">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredInventory.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No inventory items found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
              Enter the details for the new inventory item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c !== 'All').map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg, liters, meters, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">
                Threshold (Low Stock Alert)
              </Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                step="any"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the details for this inventory item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c !== 'All').map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-threshold">
                Threshold (Low Stock Alert)
              </Label>
              <Input
                id="edit-threshold"
                type="number"
                min="0"
                step="any"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInventory;
