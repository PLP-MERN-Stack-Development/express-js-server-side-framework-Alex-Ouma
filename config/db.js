const mongose = require('mongoose');
require('dotenv').config();
const connectDB = async () => {
  try {
    await mongose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbname: 'week2'
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
module.exports = connectDB;