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
import { Users, Search, Plus, Edit, ArrowUp, ArrowDown, Loader } from 'lucide-react';
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

// Department options
const departments = ['All', 'Production', 'QA', 'R&D', 'Management', 'Logistics'];

// Status options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'on leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
];

const initialFormState = {
  name: '',
  position: '',
  department: '',
  email: '',
  phone: '',
  joinDate: '',
  status: 'active',
};

const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Fetch staff data from the API
  useEffect(() => {
    let isMounted = true;
    
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await makeRequest(`${API_BASE_URL}/staff`);
        
        if (isMounted) {
          // Convert to the format our component expects
          const formattedData = data.map(person => ({
            ...person,
            id: person._id,
            joinDate: new Date(person.joinDate)
          }));
          
          setStaff(formattedData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching staff data:', err);
        if (isMounted) {
          setError('Failed to fetch staff data');
          toast.error('Failed to load staff data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStaff();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Search and filter staff
  const filterStaff = () => {
    let filtered = [...staff];

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (employee) =>
          employee.name.toLowerCase().includes(query) ||
          employee.position.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query)
      );
    }

    // Apply department filter
    if (departmentFilter !== 'All') {
      filtered = filtered.filter((employee) => employee.department === departmentFilter);
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
      
      // For dates
      if (fieldA instanceof Date && fieldB instanceof Date) {
        return sortDirection === 'asc'
          ? fieldA.getTime() - fieldB.getTime()
          : fieldB.getTime() - fieldA.getTime();
      }
      
      return 0;
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

  const handleAddEmployee = async () => {
    // Validation
    if (!formData.name || !formData.position || !formData.department || !formData.email || !formData.phone || !formData.joinDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newEmployee = {
      name: formData.name,
      position: formData.position,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      joinDate: new Date(formData.joinDate),
      status: formData.status,
    };

    try {
      // Call the API to add the staff member
      const response = await makeRequest(`${API_BASE_URL}/staff`, 'POST', newEmployee);
      
      // Update the local state with the new staff member from the server
      setStaff([...staff, { 
        ...response, 
        id: response._id,
        joinDate: new Date(response.joinDate)
      }]);
      
      toast.success(`${formData.name} added to staff`);
      setFormData(initialFormState);
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error('Error adding staff member:', err);
      toast.error('Failed to add staff member');
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee || !formData.name || !formData.position || !formData.department || !formData.email || !formData.phone || !formData.joinDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedEmployee = {
      name: formData.name,
      position: formData.position,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      joinDate: new Date(formData.joinDate),
      status: formData.status,
    };

    try {
      // Call the API to update the staff member
      await makeRequest(`${API_BASE_URL}/staff/${selectedEmployee._id || selectedEmployee.id}`, 'PUT', updatedEmployee);
      
      // Update the local state
      const updatedStaff = staff.map((employee) => {
        if (employee.id === selectedEmployee.id || employee._id === selectedEmployee._id) {
          return {
            ...employee,
            ...updatedEmployee,
            joinDate: new Date(formData.joinDate),
          };
        }
        return employee;
      });

      setStaff(updatedStaff);
      toast.success(`${formData.name}'s information updated successfully`);
      setFormData(initialFormState);
      setSelectedEmployee(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating staff member:', err);
      toast.error('Failed to update staff member');
    }
  };

  const startEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      position: employee.position,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      joinDate: employee.joinDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      status: employee.status,
    });
    setIsEditDialogOpen(true);
  };

  const filteredStaff = filterStaff();

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Users className="mr-2 h-6 w-6" />
            Staff Management
          </h1>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-dye-600 hover:bg-dye-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
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
              placeholder="Search staff..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setDepartmentFilter('All');
            }}
          >
            Reset Filters
          </Button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-dye-600" />
            <span className="ml-2 text-lg">Loading staff data...</span>
          </div>
        ) : (
          /* Staff table */
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
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('position')}>
                      Position
                      {sortField === 'position' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('department')}>
                      Department
                      {sortField === 'department' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="table-header-cell">Contact</th>
                  <th className="table-header-cell">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('joinDate')}>
                      Join Date
                      {sortField === 'joinDate' && (
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
                  <th className="table-header-cell">Action</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredStaff.map((employee) => {
                  // Determine status badge class
                  let statusBadge = '';
                  let statusDot = '';
                  
                  switch(employee.status) {
                    case 'active':
                      statusBadge = 'badge-success';
                      statusDot = 'status-dot-success';
                      break;
                    case 'on leave':
                      statusBadge = 'badge-warning';
                      statusDot = 'status-dot-warning';
                      break;
                    case 'terminated':
                      statusBadge = 'badge-danger';
                      statusDot = 'status-dot-danger';
                      break;
                    default:
                      statusBadge = 'badge-info';
                      statusDot = 'status-dot-info';
                  }
                  
                  return (
                    <tr key={employee.id} className="table-row">
                      <td className="table-cell font-medium">{employee.name}</td>
                      <td className="table-cell">{employee.position}</td>
                      <td className="table-cell">{employee.department}</td>
                      <td className="table-cell">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{employee.email}</div>
                          <div className="text-xs">{employee.phone}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {employee.joinDate.toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${statusBadge}`}>
                          <span className={`${statusDot}`}></span>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(employee)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No staff found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the details for the new employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.filter(d => d !== 'All').map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee Information</DialogTitle>
            <DialogDescription>
              Update the details for this employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger id="edit-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.filter(d => d !== 'All').map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-joinDate">Join Date</Label>
              <Input
                id="edit-joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee}>
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStaff;
