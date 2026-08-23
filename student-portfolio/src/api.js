const BASE_URL = 'http://localhost:5001';

export const getTasks = () => {
  return fetch(`${BASE_URL}/tasks`).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => { throw new Error(err.message || 'Failed to fetch tasks'); });
    }
    return res.json();
  });
};

export const createTask = (taskData) => {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => { throw new Error(err.messages ? err.messages.join(', ') : 'Failed to create task'); });
    }
    return res.json();
  });
};

export const updateTask = (id, taskData) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => { throw new Error(err.messages ? err.messages.join(', ') : 'Failed to update task'); });
    }
    return res.json();
  });
};

export const deleteTask = (id) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => { throw new Error(err.message || 'Failed to delete task'); });
    }
    return res.json();
  });
};
