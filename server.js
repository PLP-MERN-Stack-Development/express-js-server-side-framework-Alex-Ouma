// server.js - Starter Express server for Week 2 assignment

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('./config/db');
connectDB();
require('dotenv').config();

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
  const apiKey = req.headers['x-api-key'];
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
// Get all products with filtering and pagination
app.get('/api/products', authMiddleware, (req, res, next) => {
  try {
    let filteredProducts = [...products];
    
    // Category filter
    if (req.query.category) {
      filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
      total: filteredProducts.length,
      page,
      limit,
      products: paginatedProducts
    });
  } catch (error) {
    next(error);
  }
});

// Search products by name
app.get('/api/products/search', authMiddleware, (req, res, next) => {
  try {
    const query = req.query.q?.toLowerCase();
    if (!query) {
      return next(new ValidationError('Search query is required'));
    }
    
    const results = products.filter(p => p.name.toLowerCase().includes(query));
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Get a specific product
app.get('/api/products/:id', authMiddleware, (req, res, next) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Create a new product
app.post('/api/products', authMiddleware, validateProduct, (req, res, next) => {
  try {
    const product = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date()
    };
    products.push(product);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// Update a product
app.put('/api/products/:id', authMiddleware, validateProduct, (req, res, next) => {
  try {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      throw new NotFoundError('Product not found');
    }
    products[index] = { ...products[index], ...req.body };
    res.json(products[index]);
  } catch (error) {
    next(error);
  }
});

// Delete a product
app.delete('/api/products/:id', authMiddleware, (req, res, next) => {
  try {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      throw new NotFoundError('Product not found');
    }
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Product statistics
app.get('/api/products/stats', authMiddleware, (req, res, next) => {
  try {
    const stats = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalProducts: products.length,
      categories: stats
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