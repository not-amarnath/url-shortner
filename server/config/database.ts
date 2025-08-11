import mongoose from 'mongoose';

// MongoDB connection - use the exact connection string provided by user
const customURI = process.env.MONGODB_URI;
const uri1 = process.env.MONGODB_URI_1;
const uri2 = process.env.MONGODB_URI_2;
if (!uri1 || !uri2) {
  throw new Error("Missing MongoDB connection string in environment variables.");
}

const MONGODB_URIS = customURI ? [customURI] : [uri1, uri2];

export const connectDB = async (): Promise<void> => {
  let connected = false;

  console.log('🔌 Attempting MongoDB connection with provided credentials...');

  for (let i = 0; i < MONGODB_URIS.length; i++) {
    const uri = MONGODB_URIS[i];
    try {
      console.log(`🔄 Trying connection ${i + 1}/${MONGODB_URIS.length}...`);
      console.log(`🔗 URI: ${uri.replace(/(:)([^:@]*@)/, ':***@')}`);

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority',
        dbName: 'urlshortener' // Explicitly set database name
      });

      console.log('✅ MongoDB connected successfully!');
      console.log(`📊 Database: ${mongoose.connection.name || 'urlshortener'}`);
      console.log(`👤 User: amarnathghosh123`);
      console.log(`🔗 Host: ${mongoose.connection.host}`);

      // Test the connection and database access
      await mongoose.connection.db.admin().ping();
      console.log('🏓 MongoDB ping successful!');

      // Test database access
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📁 Available collections:', collections.map(c => c.name));

      connected = true;
      break;
    } catch (error: any) {
      console.log(`❌ Connection attempt ${i + 1} failed`);
      console.error('Error details:', error.message);

      // Provide specific error guidance
      if (error.message.includes('ENOTFOUND')) {
        console.log('🔍 DNS Error - Cluster hostname not found. Check cluster name.');
      } else if (error.message.includes('Authentication failed')) {
        console.log('🔐 Auth Error - Check username/password.');
      } else if (error.message.includes('IP whitelist')) {
        console.log('🚫 IP Error - Add your IP to MongoDB Atlas whitelist.');
      }

      if (i < MONGODB_URIS.length - 1) {
        console.log('⏭️ Trying next connection string...');
      }
    }
  }

  if (!connected) {
    console.log('❌ All MongoDB connection attempts failed.');
    console.log('');
    console.log('📝 TO FIX THIS - GET YOUR EXACT CONNECTION STRING:');
    console.log('   1. Go to https://cloud.mongodb.com/');
    console.log('   2. Sign in with your account');
    console.log('   3. Click "Connect" on your cluster');
    console.log('   4. Choose "Connect your application"');
    console.log('   5. Copy the connection string');
    console.log('   6. Replace <password> with: nsizMIm4QC92ULLH');
    console.log('   7. Set MONGODB_URI environment variable');
    console.log('');
    console.log('🔧 ALTERNATIVE - Set environment variable:');
    console.log('   export MONGODB_URI="your-connection-string-here"');
    console.log('   npm run dev');
    console.log('');
    console.log('💾 Using memory storage for now (data will be lost on restart).');
    console.log('');
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};
