// server.js - Starter Express server for Week 2 assignment

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('./config/db');
connectDB();
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Custom Error Classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Middleware setup
// Logger Middleware
const loggerMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
};

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  // Accept API key in header or query for convenience
  const apiKeyHeader = req.headers['x-api-key'];
  const apiKeyQuery = req.query['x-api-key'];
  const apiKey = apiKeyHeader || apiKeyQuery;
  if (!apiKey || apiKey !== '12345') {
    return next(new ValidationError('Invalid or missing API key'));
  }
  next();
};

// Validation Middleware for Product Creation/Update
const validateProduct = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || typeof price !== 'number' || !category || typeof inStock !== 'boolean') {
    return next(new ValidationError('Invalid product data'));
  }
  next();
};

// Apply middleware
app.use(bodyParser.json());
app.use(loggerMiddleware);

// Root route
app.get('/', (req, res) => {
  res.send('Hello World.');
});

// RESTful Routes
// Get all products with filtering and pagination (reads from MongoDB)
app.get('/api/products', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const filter = {};
    if (req.query.category) {
      filter.category = { $regex: `^${req.query.category}$`, $options: 'i' };
    }

    const total = await Product.countDocuments(filter);
    const productsFromDb = await Product.find(filter).skip(startIndex).limit(limit).exec();

    res.json({
      total,
      page,
      limit,
      products: productsFromDb
    });
  } catch (error) {
    next(error);
  }
});

// Search products by name (reads from MongoDB)
app.get('/api/products/search', authMiddleware, async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return next(new ValidationError('Search query is required'));
    }

    const results = await Product.find({ name: { $regex: query, $options: 'i' } }).exec();
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Get a specific product (reads from MongoDB)
app.get('/api/products/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id;

    let product = await Product.findOne({ id }).exec();
    if (!product && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).exec();
    }

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Create a new product
app.post('/api/products', authMiddleware, validateProduct, async (req, res, next) => {
  try {
    const productData = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date()
    };

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save(); // <-- saves to MongoDB

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error saving product:', error);
    next(error);
  }
});

// Update a product
app.put('/api/products/:id', authMiddleware, validateProduct, async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Try to update by the custom `id` field first (this is what the model uses).
    let updated = await Product.findOneAndUpdate(
      { id: productId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // If not found and the provided id looks like a Mongo ObjectId, try updating by _id
    if (!updated && mongoose.Types.ObjectId.isValid(productId)) {
      updated = await Product.findByIdAndUpdate(
        productId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    }

    if (!updated) {
      throw new NotFoundError('Product not found');
    }

    // Normalize returned document to an object and ensure an `id` exists for in-memory syncing
    const updatedObj = updated.toObject ? updated.toObject() : { ...updated };
    if (!updatedObj.id) {
      // If the document doesn't have the custom `id` field (maybe it was created directly in Compass),
      // use the MongoDB _id as a fallback string.
      updatedObj.id = updatedObj._id ? updatedObj._id.toString() : productId;
    }

    // Keep the in-memory products array in sync
    const index = products.findIndex(p => p.id === updatedObj.id);
    if (index !== -1) {
      products[index] = { ...products[index], ...req.body };
    } else {
      products.push({ id: updatedObj.id, name: updatedObj.name, description: updatedObj.description, price: updatedObj.price, category: updatedObj.category, inStock: updatedObj.inStock });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    next(error);
  }
});

// Delete a product
app.delete('/api/products/:id', authMiddleware, async (req, res, next) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    next(error);
  }
});

// Product statistics (reads from MongoDB)
app.get('/api/products/stats', authMiddleware, async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const categoriesAgg = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).exec();

    const categories = categoriesAgg.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.json({
      totalProducts,
      categories
    });
  } catch (error) {
    next(error);
  }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name,
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;