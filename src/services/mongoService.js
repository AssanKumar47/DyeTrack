import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://assan0047:1@cluster0.ry3wyca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


let clientPromise;

try {

  clientPromise = client.connect();
  console.log("MongoDB connection initialized");
} catch (error) {
  console.error("Failed to initialize MongoDB connection", error);
  throw error;
}


export const getDb = async function(dbName = 'clothDyeingApp') {
  try {
    const connectedClient = await clientPromise;
    console.log(`Connected to MongoDB database: ${dbName}`);
    return connectedClient.db(dbName);
  } catch (error) {
    console.error(`Error connecting to MongoDB database: ${dbName}`, error);
    throw error;
  }
};

export default clientPromise;

