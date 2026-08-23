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

// Import Mongoose Schema models
const Task = require('./models/Task');
const User = require('./models/User');

// Import authentication & validation middlewares
const auth = require('./middleware/auth');
const { validateRegister, validateLogin, validateTaskInput } = require('./middleware/validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// --- REST Endpoints (CRUD) ---

// GET /tasks - Retrieve all tasks for the logged-in user
app.get('/tasks', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - Retrieve a single task by ID for the logged-in user
app.get('/tasks/:id', auth, validateTaskId, async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({
        error: `Not Found`,
        message: `Task with ID ${req.params.id} does not exist or you do not have permission to access it.`
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST /tasks - Create a new task in MongoDB linked to the logged-in user
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

    console.log(`[DATABASE] Created task in MongoDB with ID ${newTask._id} for user ${req.user.id}`);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - Update an existing task in MongoDB (linked to logged-in user)
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

    console.log(`[DATABASE] Updated task in MongoDB with ID ${req.params.id} for user ${req.user.id}`);
    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - Delete a task from MongoDB (linked to logged-in user)
app.delete('/tasks/:id', auth, validateTaskId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!deletedTask) {
      return res.status(404).json({
        error: `Not Found`,
        message: `Task with ID ${req.params.id} does not exist or you do not have permission to delete it.`
      });
    }

    console.log(`[DATABASE] Deleted task in MongoDB with ID ${req.params.id} for user ${req.user.id}`);
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
