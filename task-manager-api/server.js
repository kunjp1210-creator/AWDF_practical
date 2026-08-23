const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// Load environment configurations
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Setup JSON parsing middleware
app.use(express.json());

// Enable CORS globally
const cors = require('cors');
app.use(cors());

// Serve static dashboard files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB using connection URI with in-memory fallback
const startDatabase = async () => {
  const defaultUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task-manager';
  try {
    // Attempt standard connection first with a 2-second timeout
    await mongoose.connect(defaultUri, { serverSelectionTimeoutMS: 2000 });
    console.log('MongoDB connected successfully (Local instance)');
  } catch (err) {
    console.log('Local MongoDB daemon not running. Booting in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log('MongoDB Memory Server started and connected successfully!');
    } catch (memErr) {
      console.error('Failed to start MongoDB Memory Server:', memErr);
    }
  }
};
startDatabase();

// Import Mongoose Schema model
const Task = require('./models/Task');

// 1. Global Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[REQUEST] ${req.method} ${req.url} - ${timestamp}`);
  next();
});

// 2. Global Content-Type Validator Middleware for POST/PUT requests
const validateJsonHeaders = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      console.log(`[REJECT] Rejecting ${req.method} request due to missing application/json content-type`);
      return res.status(415).json({
        error: 'Unsupported Media Type. Content-Type must be application/json.'
      });
    }
  }
  next();
};
app.use(validateJsonHeaders);

// 3. Route-Specific Task ID Validator Middleware (adapted to MongoDB ObjectId strings)
const validateTaskId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.log(`[VALIDATION ERROR] Invalid Task ID format: "${req.params.id}"`);
    return res.status(400).json({
      error: 'Bad Request. Task ID must be a valid 24-character hexadecimal MongoDB ObjectId.'
    });
  }
  next();
};

// --- REST Endpoints (CRUD) ---

// GET /tasks - Retrieve all tasks
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - Retrieve a single task by ID (Supplementary Task)
app.get('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        error: `Not Found. Task with ID ${req.params.id} does not exist.`
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST /tasks - Create a new task in MongoDB
app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;
    
    // Mongoose creation. Validations are evaluated here.
    const newTask = await Task.create({
      title,
      description,
      completed: completed !== undefined ? Boolean(completed) : false,
      priority
    });

    console.log(`[DATABASE] Created task in MongoDB with ID ${newTask._id}`);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - Update an existing task in MongoDB (with runValidators: true for schema constraints)
app.put('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;
    
    // Validate empty title if sent
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: ['Task title is required and cannot be empty.']
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, completed, priority },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        error: `Not Found. Task with ID ${req.params.id} does not exist.`
      });
    }

    console.log(`[DATABASE] Updated task in MongoDB with ID ${req.params.id}`);
    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - Delete a task from MongoDB
app.delete('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({
        error: `Not Found. Task with ID ${req.params.id} does not exist.`
      });
    }

    console.log(`[DATABASE] Deleted task in MongoDB with ID ${req.params.id}`);
    res.status(200).json({
      message: 'Task deleted successfully.',
      task: deletedTask
    });
  } catch (err) {
    next(err);
  }
});

// Endpoint to deliberately trigger an error to test the global error handling middleware
app.get('/trigger-error', (req, res, next) => {
  const err = new Error('Deliberate Server Crash triggered for error handler verification.');
  next(err);
});

// 4. Custom 404 Route Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested route does not exist on this server.'
  });
});

// 5. Global Error Handling Middleware (must be defined last)
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack);
  
  // Format Mongoose Validation Error (required fields, enum constraints)
  if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors).map(val => val.message);
    console.log(`[VALIDATION REJECT] Mongoose Validation Failed:`, errorMessages);
    return res.status(400).json({
      error: 'Validation Error',
      messages: errorMessages
    });
  }

  // Format Mongoose Cast Error (invalid ObjectId strings passing base validations)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid format for field ${err.path}: "${err.value}"`
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Server successfully started on port ${PORT}`);
  console.log(`Interactive API Visualizer: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
