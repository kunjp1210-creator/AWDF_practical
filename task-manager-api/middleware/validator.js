const validateRegister = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required.');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  if (!password || !password.trim()) {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      messages: errors
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required.');
  }
  if (!password || !password.trim()) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      messages: errors
    });
  }
  next();
};

const validateTaskInput = (req, res, next) => {
  const { title } = req.body;
  const errors = [];

  if (!title || !title.trim()) {
    errors.push('Task title is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      messages: errors
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTaskInput
};
