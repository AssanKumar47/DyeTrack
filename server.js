import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import { getDb } from './src/services/mongoService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS properly to allow requests from your frontend
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional CORS headers for preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.sendStatus(200);
});

app.use(express.json());

// Connect to MongoDB and check collections
app.get('/', async (req, res) => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const db = await getDb();
    console.log("Successfully connected to MongoDB");
    
    const collections = ['users', 'orders', 'inventory', 'staff'];
    const counts = {};
    
    console.log("Checking collection counts...");
    for (const collection of collections) {
      counts[collection] = await db.collection(collection).countDocuments();
      console.log(`Collection '${collection}': ${counts[collection]} documents`);
    }
    
    res.json({
      message: 'API is running',
      status: 'Connected to MongoDB',
      collections: counts
    });
  } catch (error) {
    console.error("Error in root endpoint:", error);
    res.status(500).json({ 
      message: 'Error connecting to MongoDB', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===== USERS ROUTES =====

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection('users').find().toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const db = await getDb();
    const newUser = {
      ...req.body,
      createdAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json({ ...newUser, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    const updatedUser = {
      ...req.body,
      updatedAt: new Date()
    };
    
    delete updatedUser._id; // Remove _id if present in request body
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedUser }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ ...updatedUser, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== ORDERS ROUTES =====

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.collection('orders').find().toArray();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get orders by customer ID
app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.collection('orders')
      .find({ customerId: new ObjectId(req.params.customerId) })
      .toArray();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const db = await getDb();
    const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const db = await getDb();
    
    // Generate tracking number
    function generateTrackingNumber() {
      return 'DYE' + Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    }
    
    const newOrder = {
      ...req.body,
      trackingNumber: generateTrackingNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: req.body.status || 'pending'
    };
    
    const result = await db.collection('orders').insertOne(newOrder);
    res.status(201).json({ ...newOrder, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const db = await getDb();
    const updatedOrder = {
      ...req.body,
      updatedAt: new Date()
    };
    
    delete updatedOrder._id; // Remove _id if present in request body
    
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedOrder }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ ...updatedOrder, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.collection('orders').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== INVENTORY ROUTES =====

// Get all inventory items
app.get('/api/inventory', async (req, res) => {
  try {
    const db = await getDb();
    const items = await db.collection('inventory').find().toArray();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get inventory item by ID
app.get('/api/inventory/:id', async (req, res) => {
  try {
    const db = await getDb();
    const item = await db.collection('inventory').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new inventory item
app.post('/api/inventory', async (req, res) => {
  try {
    const db = await getDb();
    const newItem = {
      ...req.body,
      lastUpdated: new Date()
    };
    
    const result = await db.collection('inventory').insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update inventory item
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const db = await getDb();
    const updatedItem = {
      ...req.body,
      lastUpdated: new Date()
    };
    
    delete updatedItem._id; // Remove _id if present in request body
    
    const result = await db.collection('inventory').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedItem }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ ...updatedItem, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete inventory item
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.collection('inventory').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== STAFF ROUTES =====

// Get all staff
app.get('/api/staff', async (req, res) => {
  try {
    const db = await getDb();
    const staff = await db.collection('staff').find().toArray();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get staff by ID
app.get('/api/staff/:id', async (req, res) => {
  try {
    const db = await getDb();
    const staffMember = await db.collection('staff').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.json(staffMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new staff member
app.post('/api/staff', async (req, res) => {
  try {
    const db = await getDb();
    const newStaffMember = {
      ...req.body,
      joinDate: req.body.joinDate ? new Date(req.body.joinDate) : new Date(),
      status: req.body.status || 'active'
    };
    
    const result = await db.collection('staff').insertOne(newStaffMember);
    res.status(201).json({ ...newStaffMember, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update staff member
app.put('/api/staff/:id', async (req, res) => {
  try {
    const db = await getDb();
    const updatedStaffMember = { ...req.body };
    
    delete updatedStaffMember._id; // Remove _id if present in request body
    
    if (updatedStaffMember.joinDate) {
      updatedStaffMember.joinDate = new Date(updatedStaffMember.joinDate);
    }
    
    const result = await db.collection('staff').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedStaffMember }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.json({ ...updatedStaffMember, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete staff member
app.delete('/api/staff/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.collection('staff').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Authentication route (simple login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // In a real app, you would use JWT tokens here
    const { password: userPassword, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      message: 'Login successful',
      note: 'Data is being fetched directly from MongoDB'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Check MongoDB connection on startup
  try {
    console.log("Testing MongoDB connection on server startup...");
    const db = await getDb();
    console.log("MongoDB connection successful!");
    
    const collections = ['users', 'orders', 'inventory', 'staff'];
    console.log('Current data in MongoDB:');
    
    for (const collection of collections) {
      const count = await db.collection(collection).countDocuments();
      console.log(`Collection '${collection}': ${count} documents`);
    }
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
});
