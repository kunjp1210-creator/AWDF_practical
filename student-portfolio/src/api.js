const BASE_URL = 'http://localhost:5001';

// Helper to get request headers with auth token automatically attached
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem('jwt_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// User registration
export const register = (email, password) => {
  return fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => { throw new Error(err.messages ? err.messages.join(', ') : 'Registration failed'); });
    }
    return res.json();
  });
};

// User login
export const login = (email, password) => {
  return fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => { throw new Error(err.messages ? err.messages.join(', ') : 'Login failed'); });
    }
    return res.json();
  });
};

// Fetch current user details
export const getMe = () => {
  return fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: getHeaders()
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => { throw new Error(err.message || 'Failed to fetch user info'); });
    }
    return res.json();
  });
};

// Fetch tasks (tied to logged-in user)
export const getTasks = () => {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: getHeaders()
  }).then((res) => {
    if (!res.ok) {
      // Return details for token expiry logic
      return res.json().then((err) => {
        const error = new Error(err.message || 'Failed to fetch tasks');
        error.status = res.status;
        throw error;
      });
    }
    return res.json();
  });
};

// Create a task
export const createTask = (taskData) => {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(taskData)
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => {
        const error = new Error(err.messages ? err.messages.join(', ') : 'Failed to create task');
        error.status = res.status;
        throw error;
      });
    }
    return res.json();
  });
};

// Update a task
export const updateTask = (id, taskData) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(taskData)
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => {
        const error = new Error(err.messages ? err.messages.join(', ') : 'Failed to update task');
        error.status = res.status;
        throw error;
      });
    }
    return res.json();
  });
};

// Delete a task
export const deleteTask = (id) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => {
        const error = new Error(err.message || 'Failed to delete task');
        error.status = res.status;
        throw error;
      });
    }
    return res.json();
  });
};
