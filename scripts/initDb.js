import { MongoClient, ServerApiVersion } from 'mongodb';

// MongoDB connection details (copied from the mongoService.ts)
const uri = "mongodb+srv://assan0047:1@cluster0.ry3wyca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function getDb(dbName = 'clothDyeingApp') {
  await client.connect();
  return client.db(dbName);
}

async function initializeData() {
  try {
    const db = await getDb();
    
    // Check if we already have users
    const usersCount = await db.collection('users').countDocuments();
    
    if (usersCount === 0) {
      console.log('No users found. Initializing sample data...');
      
      // Create admin user
      await db.collection('users').insertOne({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@dyeingcompany.com',
        phone: '123-456-7890',
        createdAt: new Date()
      });
      
      // Create two customer users
      await db.collection('users').insertMany([
        {
          username: 'customer1',
          password: 'customer123',
          role: 'customer',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          createdAt: new Date()
        },
        {
          username: 'customer2',
          password: 'customer123',
          role: 'customer',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-987-6543',
          createdAt: new Date()
        }
      ]);
      
      // Add sample inventory items
      await db.collection('inventory').insertMany([
        {
          name: 'Blue Dye',
          category: 'Dye',
          quantity: 50,
          unit: 'kg',
          description: 'High-quality blue dye for cotton fabrics',
          threshold: 10,
          lastUpdated: new Date()
        },
        {
          name: 'Red Dye',
          category: 'Dye',
          quantity: 35,
          unit: 'kg',
          description: 'Premium red dye for all fabric types',
          threshold: 8,
          lastUpdated: new Date()
        },
        {
          name: 'Cotton Fabric',
          category: 'Fabric',
          quantity: 200,
          unit: 'meters',
          description: 'Pure cotton fabric',
          threshold: 50,
          lastUpdated: new Date()
        },
        {
          name: 'Silk Fabric',
          category: 'Fabric',
          quantity: 80,
          unit: 'meters',
          description: 'Premium silk fabric',
          threshold: 20,
          lastUpdated: new Date()
        },
        {
          name: 'Fixative',
          category: 'Chemical',
          quantity: 25,
          unit: 'liters',
          description: 'Dye fixative for longer lasting colors',
          threshold: 5,
          lastUpdated: new Date()
        }
      ]);
      
      // Add sample staff
      await db.collection('staff').insertMany([
        {
          name: 'Robert Johnson',
          position: 'Dye Master',
          department: 'Production',
          email: 'robert@dyeingcompany.com',
          phone: '555-111-2222',
          joinDate: new Date('2020-03-15'),
          status: 'active'
        },
        {
          name: 'Sarah Williams',
          position: 'Textile Specialist',
          department: 'Production',
          email: 'sarah@dyeingcompany.com',
          phone: '555-333-4444',
          joinDate: new Date('2021-06-10'),
          status: 'active'
        },
        {
          name: 'Michael Brown',
          position: 'Quality Control',
          department: 'QA',
          email: 'michael@dyeingcompany.com',
          phone: '555-555-6666',
          joinDate: new Date('2019-11-22'),
          status: 'active'
        }
      ]);
      
      // Generate unique tracking numbers
      function generateTrackingNumber() {
        return 'DYE' + Math.floor(Math.random() * 10000).toString().padStart(5, '0');
      }
      
      // Add sample orders
      const customer1 = await db.collection('users').findOne({ username: 'customer1' });
      const customer2 = await db.collection('users').findOne({ username: 'customer2' });
      
      if (customer1 && customer2) {
        await db.collection('orders').insertMany([
          {
            trackingNumber: generateTrackingNumber(),
            customerId: customer1._id,
            customerName: customer1.name,
            items: [
              { fabric: 'Cotton', color: 'Blue', quantity: 50, unit: 'meters' },
              { fabric: 'Cotton', color: 'Red', quantity: 30, unit: 'meters' }
            ],
            totalAmount: 450,
            status: 'processing',
            notes: 'Need bright colors',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          },
          {
            trackingNumber: generateTrackingNumber(),
            customerId: customer1._id,
            customerName: customer1.name,
            items: [
              { fabric: 'Silk', color: 'Purple', quantity: 20, unit: 'meters' }
            ],
            totalAmount: 350,
            status: 'completed',
            notes: 'Handle with care',
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            estimatedDelivery: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            deliveredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
          },
          {
            trackingNumber: generateTrackingNumber(),
            customerId: customer2._id,
            customerName: customer2.name,
            items: [
              { fabric: 'Cotton', color: 'Green', quantity: 100, unit: 'meters' }
            ],
            totalAmount: 550,
            status: 'pending',
            notes: 'Urgent order',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          },
          {
            trackingNumber: generateTrackingNumber(),
            customerId: customer2._id,
            customerName: customer2.name,
            items: [
              { fabric: 'Silk', color: 'Gold', quantity: 35, unit: 'meters' },
              { fabric: 'Silk', color: 'Silver', quantity: 35, unit: 'meters' }
            ],
            totalAmount: 980,
            status: 'ready',
            notes: 'For exhibition',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          }
        ]);
      }
      
      console.log('Sample data initialized successfully');
    } else {
      console.log('Database already contains data, skipping initialization');
    }
    
  } catch (error) {
    console.error('Error initializing data:', error);
  } finally {
    await client.close();
  }
}

// Main function
async function main() {
  console.log('Starting database initialization...');
  
  try {
    await initializeData();
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
