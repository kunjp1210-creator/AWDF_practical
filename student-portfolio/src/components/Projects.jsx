import React, { useState, useEffect, lazy, Suspense, memo, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, register, login, getMe, generateAiDescription } from '../api';
import { lazyWithDelay } from '../utils/lazyWithDelay';

// Supplementary Problem 1: Lazy load heavy analytical chart component on demand
const TaskAnalyticsChart = lazyWithDelay(() => import('./TaskAnalyticsChart'), 250);

// Inline Spinner Component
function Spinner({ text }) {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
        {text || 'Loading...'}
      </p>
    </div>
  );
}

// Inline ErrorMessage Component
function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
      <h3 className="error-title" style={{ color: '#ef4444', marginBottom: '1rem' }}>Connection Error</h3>
      <p className="error-msg" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="hero-cta" style={{ border: 'none', padding: '0.6rem 1.2rem' }}>
          ⚡ Retry Connection
        </button>
      )}
    </div>
  );
}

// Supplementary Problem 3: Memoized TaskItem to prevent unnecessary re-renders during parent state changes
const TaskItem = memo(function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div
      className="task-row-card glass-panel"
      style={{ opacity: task.isOptimistic ? 0.6 : 1 }}
    >
      <div className="task-checkbox-cell">
        <input
          type="checkbox"
          checked={task.completed}
          disabled={task.isOptimistic}
          onChange={() => onToggle(task._id, task.completed)}
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
        onClick={() => onDelete(task._id, task.title)}
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
  );
});

// Main Projects Component
function Projects() {
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Auth Form input states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Task list states
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Task Form input states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  // Practical 13: AI Generation states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  // Supplementary Feature: Toggle on-demand analytics chunk loading
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Trigger floating toast notifications
  const showToast = (text, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Helper to handle authentication failures (expiry / malformed tokens)
  const handleAuthFailure = (err) => {
    if (err.status === 401) {
      localStorage.removeItem('jwt_token');
      setToken(null);
      setUser(null);
      setTasks([]);
      showToast('Session expired. Please log in again.', 'error');
    } else {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  // Fetch current user details (/me) and user task documents
  const loadUserData = () => {
    setLoading(true);
    setError(null);
    
    getMe()
      .then((profile) => {
        setUser(profile);
        return getTasks();
      })
      .then((taskList) => {
        setTasks(taskList);
      })
      .catch((err) => {
        if (err.status === 401) {
          handleAuthFailure(err);
        } else {
          setError(err.message || 'Failed to fetch user database details.');
          showToast('Failed to load tasks from database.', 'error');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Monitor token state
  useEffect(() => {
    if (token) {
      loadUserData();
    } else {
      setUser(null);
      setTasks([]);
    }
  }, [token]);

  // Handle Login or Register submit actions
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) return;

    setAuthLoading(true);
    setAuthError(null);

    const email = emailInput.trim();
    const password = passwordInput.trim();

    if (authMode === 'register') {
      register(email, password)
        .then((res) => {
          localStorage.setItem('jwt_token', res.token);
          setToken(res.token);
          showToast('Registration successful! Welcome 🎉');
          setEmailInput('');
          setPasswordInput('');
        })
        .catch((err) => {
          setAuthError(err.message);
          showToast(err.message || 'Registration failed.', 'error');
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      login(email, password)
        .then((res) => {
          localStorage.setItem('jwt_token', res.token);
          setToken(res.token);
          showToast('Welcome back! Logged in.');
          setEmailInput('');
          setPasswordInput('');
        })
        .catch((err) => {
          setAuthError(err.message);
          showToast(err.message || 'Invalid email or password.', 'error');
        })
        .finally(() => {
          setAuthLoading(false);
        });
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
    setTasks([]);
    showToast('Logged out successfully.');
  };

  // Practical 13: Handle AI Task Description Generation with Graceful Degradation
  const handleAiGenerate = async () => {
    if (!title.trim()) {
      showToast('Please enter a task title first to generate AI description.', 'error');
      return;
    }

    setAiLoading(true);
    setAiNotice(null);

    try {
      const data = await generateAiDescription(title.trim());
      if (data.description) {
        setDescription(data.description);
      }
      if (data.priority) {
        setPriority(data.priority);
      }

      if (data.fallback) {
        setAiNotice({
          type: 'fallback',
          text: 'Offline Graceful Fallback: Description generated via heuristic logic. Core application running smoothly without third-party disruption.',
          reason: data.fallbackReason
        });
        showToast('Generated description (Offline Fallback Mode).');
      } else {
        setAiNotice({
          type: 'success',
          text: 'AI Description generated successfully! You can review and edit it below.'
        });
        showToast('✨ AI Description generated!');
      }
    } catch (err) {
      if (err.status === 429) {
        setAiNotice({
          type: 'warning',
          text: err.message || 'AI generation rate limit exceeded. Please wait a moment.'
        });
        showToast('Rate limit: please wait a moment.', 'error');
      } else {
        setAiNotice({
          type: 'warning',
          text: `AI service notice: ${err.message}. Task management remains fully operational.`
        });
        showToast('AI service notice. You can type description manually.', 'error');
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Handle task creation (POST /tasks) with Optimistic UI updates
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskTitle = title.trim();
    const taskDesc = description.trim();
    const taskPriority = priority;

    const optimisticTask = {
      _id: 'optimistic-' + Date.now(),
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      completed: false,
      isOptimistic: true
    };

    setTasks((prev) => [...prev, optimisticTask]);
    showToast('Task added (Optimistic UI)...');

    setTitle('');
    setDescription('');
    setPriority('medium');
    setAiNotice(null);

    createTask({ title: taskTitle, description: taskDesc, priority: taskPriority })
      .then((savedTask) => {
        setTasks((prev) =>
          prev.map((t) => (t._id === optimisticTask._id ? savedTask : t))
        );
        showToast('Document saved in MongoDB!');
      })
      .catch((err) => {
        setTasks((prev) => prev.filter((t) => t._id !== optimisticTask._id));
        handleAuthFailure(err);
      });
  };

  // Toggle task completion (PUT /tasks/:id) - Wrapped in useCallback for memoized child items
  const handleToggleComplete = useCallback((id, currentCompletedStatus) => {
    const newCompletedStatus = !currentCompletedStatus;

    setTasks((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: newCompletedStatus } : t))
    );

    updateTask(id, { completed: newCompletedStatus })
      .then((updatedTask) => {
        setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
        showToast(newCompletedStatus ? 'Task completed! 🎉' : 'Task marked active.');
      })
      .catch((err) => {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t._id === id ? { ...t, completed: currentCompletedStatus } : t))
        );
        handleAuthFailure(err);
      });
  }, []);

  // Delete task (DELETE /tasks/:id) - Wrapped in useCallback for memoized child items
  const handleDeleteTrigger = useCallback((id, taskTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${taskTitle}"?`)) {
      return;
    }

    let deletedItem = null;
    setTasks((prev) => {
      deletedItem = prev.find((t) => t._id === id);
      return prev.filter((t) => t._id !== id);
    });

    deleteTask(id)
      .then(() => {
        showToast('Task deleted from MongoDB.');
      })
      .catch((err) => {
        if (deletedItem) {
          setTasks((prev) => [...prev, deletedItem]);
        }
        handleAuthFailure(err);
      });
  }, []);

  return (
    <section id="projects" className="container" style={{ minHeight: '80vh' }}>
      <h2 className="section-title">Database Task Manager</h2>

      {/* Floating Toast notifications */}
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

      {/* Authentication Layer */}
      {!token ? (
        <div className="auth-container glass-panel">
          <h3 className="auth-title">
            {authMode === 'login' ? 'Secure Log In' : 'Create Account'}
          </h3>
          <p className="auth-subtitle">
            {authMode === 'login' 
              ? 'Enter credentials to access your task dashboard' 
              : 'Register to create your own isolated task database'}
          </p>

          {authError && (
            <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '6px', padding: '0.6rem 1rem', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>
            
            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
              />
            </div>

            <button type="submit" disabled={authLoading} className="auth-submit-btn">
              {authLoading ? 'Verifying...' : authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-toggle-link">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
              className="auth-toggle-action"
            >
              {authMode === 'login' ? 'Register' : 'Log In'}
            </span>
          </p>
        </div>
      ) : loading && !user ? (
        <Spinner text="Authenticating user credentials..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadUserData} />
      ) : (
        <>
          {/* User profile header */}
          <div className="user-auth-header glass-panel">
            <div className="user-email-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-secondary)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Logged in as: <strong className="user-email-value">{user?.email}</strong></span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Log Out
            </button>
          </div>

          {/* On-Demand Lazy Component: Analytics Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowAnalytics((prev) => !prev)}
              className="analytics-toggle-btn"
            >
              {showAnalytics ? '▲ Hide Analytics' : '📊 View Task Analytics (Lazy-Loaded)'}
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {tasks.length} task{tasks.length === 1 ? '' : 's'} in database
            </span>
          </div>

          {/* Suspense boundary for on-demand heavy component */}
          {showAnalytics && (
            <Suspense fallback={<Spinner text="Loading Analytics module chunk..." />}>
              <TaskAnalyticsChart tasks={tasks} />
            </Suspense>
          )}

          {/* Add Task Form with Practical 13 AI Integration */}
          <div className="task-form-wrapper glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Create New Database Document</h3>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="ai-suggest-btn"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.25))',
                  border: '1px solid rgba(168, 85, 247, 0.45)',
                  color: '#c084fc',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(168, 85, 247, 0.15)'
                }}
              >
                {aiLoading ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(192, 132, 252, 0.3)', borderTopColor: '#c084fc', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                    <span>Thinking with AI...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generate Description with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Practical 13: AI Suggestion Notice & Disclaimer */}
            {aiNotice && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  lineHeight: '1.4',
                  background: aiNotice.type === 'fallback'
                    ? 'rgba(234, 179, 8, 0.12)'
                    : aiNotice.type === 'warning'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(34, 197, 94, 0.12)',
                  border: `1px solid ${
                    aiNotice.type === 'fallback'
                      ? 'rgba(234, 179, 8, 0.35)'
                      : aiNotice.type === 'warning'
                      ? 'rgba(239, 68, 68, 0.35)'
                      : 'rgba(34, 197, 94, 0.35)'
                  }`,
                  color: aiNotice.type === 'fallback'
                    ? '#fde047'
                    : aiNotice.type === 'warning'
                    ? '#fca5a5'
                    : '#86efac'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                  {aiNotice.type === 'fallback' ? '⚠️ Graceful Degradation Active (Offline Heuristic Mode)' : aiNotice.type === 'warning' ? '⏳ Request Notice' : '✨ AI Suggestion Generated'}
                </div>
                <div>{aiNotice.text}</div>
                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', opacity: 0.85, fontStyle: 'italic' }}>
                  ℹ️ Disclaimer: AI-generated suggestions should be reviewed and verified by the user before saving.
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="task-form-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input
                  type="text"
                  placeholder="Task title (required, e.g. 'Setup CI/CD Pipeline')..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="task-input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Editable description (or click 'Generate Description with AI')..."
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
          {loading ? (
            <Spinner text="Synchronizing task database..." />
          ) : (
            <div className="projects-grid">
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                  <p>No documents found in MongoDB. Create a task above to persist data!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={handleToggleComplete}
                    onDelete={handleDeleteTrigger}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Projects;
