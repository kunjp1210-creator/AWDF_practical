import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../api';

// Inline Spinner Component
function Spinner() {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
        Fetching database documents...
      </p>
    </div>
  );
}

// Inline ErrorMessage Component
function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container glass-panel">
      <div className="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 className="error-title">Database Fetch Failed</h3>
      <p className="error-msg">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-btn">
          ⚡ Retry Connection
        </button>
      )}
    </div>
  );
}

// Main Projects Component
function Projects() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Form inputs state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  // Trigger floating toast notifications
  const showToast = (text, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Load tasks on mount
  const fetchTasks = () => {
    setLoading(true);
    setError(null);
    getTasks()
      .then((data) => {
        setTasks(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch tasks from server.');
        showToast('Failed to load database documents.', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle task creation with Optimistic UI updates
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskTitle = title.trim();
    const taskDesc = description.trim();
    const taskPriority = priority;

    // 1. Create a temporary optimistic task object
    const optimisticTask = {
      _id: 'optimistic-' + Date.now(),
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      completed: false,
      isOptimistic: true // Marker for UI styling
    };

    // 2. Optimistically append the task to the local state list immediately
    setTasks((prev) => [...prev, optimisticTask]);
    showToast('Task added (Optimistic UI Update)...');

    // Reset form fields
    setTitle('');
    setDescription('');
    setPriority('medium');

    // 3. Fire the API POST request to save the document in MongoDB
    createTask({ title: taskTitle, description: taskDesc, priority: taskPriority })
      .then((savedTask) => {
        // Replace the temporary task in local state list with the actual saved task from MongoDB
        setTasks((prev) =>
          prev.map((t) => (t._id === optimisticTask._id ? savedTask : t))
        );
        showToast('Document successfully saved in MongoDB!');
      })
      .catch((err) => {
        // Rollback: Remove the temporary task from local state list if save failed
        setTasks((prev) => prev.filter((t) => t._id !== optimisticTask._id));
        showToast(err.message || 'Failed to save task in MongoDB.', 'error');
      });
  };

  // Handle task completion toggle (PUT /tasks/:id)
  const handleToggleComplete = (id, currentCompletedStatus) => {
    const newCompletedStatus = !currentCompletedStatus;
    
    // Find target task to store original value for rollback
    const originalTasks = [...tasks];

    // Optimistically update local state completion
    setTasks((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: newCompletedStatus } : t))
    );

    updateTask(id, { completed: newCompletedStatus })
      .then((updatedTask) => {
        // Update task state with actual response
        setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
        showToast(newCompletedStatus ? 'Task completed! 🎉' : 'Task marked active.');
      })
      .catch((err) => {
        // Rollback to original state list
        setTasks(originalTasks);
        showToast('Failed to update task status.', 'error');
      });
  };

  // Handle task deletion with a confirmation dialog (DELETE /tasks/:id)
  const handleDeleteTrigger = (id, taskTitle) => {
    // Supplementary problem: Add a confirmation dialog before deleting a task
    if (!window.confirm(`Are you sure you want to permanently delete the task "${taskTitle}"?`)) {
      return;
    }

    const originalTasks = [...tasks];

    // Optimistically remove from UI
    setTasks((prev) => prev.filter((t) => t._id !== id));

    deleteTask(id)
      .then(() => {
        showToast('Task permanently deleted from database.');
      })
      .catch((err) => {
        // Rollback
        setTasks(originalTasks);
        showToast('Failed to delete task from database.', 'error');
      });
  };

  return (
    <section id="projects" className="container" style={{ minHeight: '80vh' }}>
      <h2 className="section-title">Database Task Manager</h2>

      {/* Floating Toast Notification Cards */}
      <div className="toast-alerts-layer">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-message-card ${toast.type}`}>
            {toast.type === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTasks} />
      ) : (
        <>
          {/* Add Task Form wrapper */}
          <div className="task-form-wrapper glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', fontWeight: 600 }}>Create New Database Document</h3>
            <form onSubmit={handleCreateSubmit} className="task-form-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input
                  type="text"
                  placeholder="Task title (required)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="task-input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Optional description details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="task-input-field"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="task-select-field"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                
                <button type="submit" className="hero-cta" style={{ border: 'none', height: '100%', padding: '0.8rem 1.5rem', justifyContent: 'center' }}>
                  Save Task
                </button>
              </div>
            </form>
          </div>

          {/* Tasks Grid */}
          <div className="projects-grid">
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                <p>No documents found in MongoDB. Create a task above to persist data!</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className="task-row-card glass-panel"
                  style={{ opacity: task.isOptimistic ? 0.6 : 1 }}
                >
                  <div className="task-checkbox-cell">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      disabled={task.isOptimistic}
                      onChange={() => handleToggleComplete(task._id, task.completed)}
                      className="task-checker-input"
                    />
                  </div>

                  <div className="task-body-cell">
                    <div className="task-row-header">
                      <span className={`task-row-title ${task.completed ? 'completed' : ''}`}>
                        {task.title}
                      </span>
                      <span className={`priority-tag priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      {task.isOptimistic && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-secondary)', fontStyle: 'italic' }}>
                          Saving...
                        </span>
                      )}
                    </div>
                    
                    <p className="task-row-description">
                      {task.description || 'No description provided.'}
                    </p>

                    <div className="task-meta-footer">
                      <span className="task-id-tag">
                        MongoDB ObjectId: {task._id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTrigger(task._id, task.title)}
                    disabled={task.isOptimistic}
                    className="task-delete-trigger"
                    title="Delete Task"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default Projects;
