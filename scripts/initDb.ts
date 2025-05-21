import { getDb } from '../src/services/mongoService';

async function checkMongoDB() {
  console.log('Testing MongoDB connection...');
  
  try {
    const db = await getDb();
    
    // Check collections and data counts
    const collections = ['users', 'orders', 'inventory', 'staff'];
    console.log('MongoDB connection successful!');
    
    // Report on existing data
    for (const collection of collections) {
      const count = await db.collection(collection).countDocuments();
      console.log(`Collection '${collection}': ${count} documents`);
    }
    
    console.log('\nDatabase check complete. Data is being fetched directly from MongoDB.');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return false;
  }
}

async function main() {
  console.log('Starting MongoDB check...');
  
  try {
    const success = await checkMongoDB();
    
    if (success) {
      console.log('MongoDB is properly configured and accessible.');
    } else {
      console.error('Failed to connect to MongoDB properly.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  } finally {
    // Give MongoDB operations time to complete before exiting
    setTimeout(() => {
      console.log('Exiting...');
      process.exit(0);
    }, 1000);
  }
}

main();
