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
    const instanceType = defaultUri.includes('mongodb://mongodb') ? 'Docker container service' : 'Local instance';
    console.log(`MongoDB connected successfully to ${defaultUri} (${instanceType})`);
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

// Import Mongoose Schema models
const Task = require('./models/Task');
const User = require('./models/User');

// Import authentication & validation middlewares
const auth = require('./middleware/auth');
const { validateRegister, validateLogin, validateTaskInput } = require('./middleware/validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import In-Memory Caching Module (Practical 9: node-cache)
const cache = require('./cache');

// Import Event-Driven Architecture Modules (Practical 10: EventEmitter)
const taskEvents = require('./events');
require('./listeners'); // Register background event listeners at server boot

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

// --- Authentication Endpoints ---

// POST /register - Register a new user
app.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'Conflict Error',
        messages: ['Email address is already registered.']
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword
    });

    console.log(`[USER] Registered new user with ID ${newUser._id}`);
    
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: newUser._id, email: newUser.email }
    });
  } catch (err) {
    next(err);
  }
});

// POST /login - Authenticate user & return JWT token
app.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        messages: ['Invalid email or password.']
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        messages: ['Invalid email or password.']
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    next(err);
  }
});

// GET /me - Get currently logged-in user profile (Supplementary task)
app.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found.'
      });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// --- REST Endpoints (CRUD with In-Memory node-cache) ---

// GET /tasks - Retrieve all tasks for the logged-in user (with 60s caching)
app.get('/tasks', auth, async (req, res, next) => {
  try {
    const cacheKey = `tasks_${req.user.id}`;
    const cachedTasks = cache.get(cacheKey);

    if (cachedTasks !== undefined) {
      console.log(`[CACHE HIT] Serving cached tasks for user ${req.user.id} (Key: ${cacheKey})`);
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedTasks);
    }

    console.log(`[CACHE MISS] Querying MongoDB for tasks of user ${req.user.id}`);
    const tasks = await Task.find({ user: req.user.id });
    
    // Store in node-cache with default 60s TTL
    cache.set(cacheKey, tasks);
    res.set('X-Cache', 'MISS');
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - Retrieve a single task by ID for user (Supplementary Problem 1: Separate item cache)
app.get('/tasks/:id', auth, validateTaskId, async (req, res, next) => {
  try {
    const cacheKey = `task_${req.user.id}_${req.params.id}`;
    const cachedTask = cache.get(cacheKey);

    if (cachedTask !== undefined) {
      console.log(`[CACHE HIT] Serving cached single task ${req.params.id} (Key: ${cacheKey})`);
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedTask);
    }

    console.log(`[CACHE MISS] Querying MongoDB for single task ${req.params.id}`);
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({
        error: `Not Found`,
        message: `Task with ID ${req.params.id} does not exist or you do not have permission to access it.`
      });
    }

    // Cache individual task
    cache.set(cacheKey, task);
    res.set('X-Cache', 'MISS');
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST /tasks - Create a new task in MongoDB & invalidate user's cached task list
app.post('/tasks', auth, validateTaskInput, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;
    
    const newTask = await Task.create({
      title,
      description,
      completed: completed !== undefined ? Boolean(completed) : false,
      priority,
      user: req.user.id
    });

    // Invalidate cached task list so fresh data is immediately available
    const cacheKey = `tasks_${req.user.id}`;
    cache.del(cacheKey);
    console.log(`[CACHE INVALIDATED] Evicted "${cacheKey}" on new task creation`);

    console.log(`[DATABASE] Created task in MongoDB with ID ${newTask._id} for user ${req.user.id}`);
    
    // Practical 10: Immediate API response with timestamp logging
    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API] ⚡ Response sent (201 Created) at ${apiResponseTimestamp} for task: "${newTask.title}"`);
    res.status(201).json(newTask);

    // Practical 10: Emit task-created event asynchronously AFTER response is sent
    taskEvents.emit('task-created', {
      id: newTask._id,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      user: req.user.email || req.user.id
    });
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - Update existing task & invalidate both list and item cache
app.put('/tasks/:id', auth, validateTaskId, validateTaskInput, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, description, completed, priority },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        error: `Not Found`,
        message: `Task with ID ${req.params.id} does not exist or you do not have permission to modify it.`
      });
    }

    // Invalidate list cache and single-item cache
    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.user.id}_${req.params.id}`);
    console.log(`[CACHE INVALIDATED] Evicted list and item cache for task ${req.params.id}`);

    console.log(`[DATABASE] Updated task in MongoDB with ID ${req.params.id} for user ${req.user.id}`);
    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - Delete task & invalidate both list and item cache
app.delete('/tasks/:id', auth, validateTaskId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!deletedTask) {
      return res.status(404).json({
        error: `Not Found`,
        message: `Task with ID ${req.params.id} does not exist or you do not have permission to delete it.`
      });
    }

    // Invalidate list cache and single-item cache
    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.user.id}_${req.params.id}`);
    console.log(`[CACHE INVALIDATED] Evicted list and item cache for deleted task ${req.params.id}`);

    console.log(`[DATABASE] Deleted task in MongoDB with ID ${req.params.id} for user ${req.user.id}`);
    
    // Practical 10: Immediate API response with timestamp logging
    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API] ⚡ Response sent (200 OK) at ${apiResponseTimestamp} for deleted task ID: ${deletedTask._id}`);
    res.status(200).json({
      message: 'Task deleted successfully.',
      task: deletedTask
    });

    // Practical 10: Emit task-deleted event asynchronously AFTER response is sent
    taskEvents.emit('task-deleted', {
      id: deletedTask._id,
      title: deletedTask.title,
      user: req.user.email || req.user.id
    });
  } catch (err) {
    next(err);
  }
});

// GET /cache-stats - Debug endpoint exposing cache telemetry (Supplementary Problem 2)
app.get('/cache-stats', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'In-Memory Cache Telemetry (node-cache)',
    data: cache.getStats()
  });
});

// POST /cache-flush - Flush cache manually for benchmarking
app.post('/cache-flush', (req, res) => {
  cache.flush();
  res.status(200).json({
    message: 'Cache flushed successfully.',
    stats: cache.getStats()
  });
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
