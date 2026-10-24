const taskEvents = require('./events');

/**
 * Listener 1: 'task-created'
 * Background notification handler that processes task creation events.
 * Simulates a slow notification delivery (e.g., sending email or webhook)
 * to vividly demonstrate non-blocking asynchronous execution.
 */
taskEvents.on('task-created', (task) => {
  const receiveTimestamp = new Date().toISOString();
  console.log(`[Notification Worker] 🔔 Background task-created event received at ${receiveTimestamp}`);
  console.log(`   Task Title : "${task.title}"`);
  console.log(`   Assigned To: ${task.user || 'Unknown User'}`);
  console.log(`   Priority   : ${task.priority || 'medium'}`);

  // Simulate a slow background job (2-second non-blocking delay)
  setTimeout(() => {
    try {
      const completionTimestamp = new Date().toISOString();
      console.log(`[Notification Worker] ✅ Email notification sent for "${task.title}"`);
      console.log(`   Dispatched: ${receiveTimestamp}`);
      console.log(`   Completed : ${completionTimestamp} (+2000ms after API responded)\n`);
    } catch (err) {
      taskEvents.emit('error', err);
    }
  }, 2000);
});

/**
 * Listener 2 (Supplementary Problem 1): 'task-deleted'
 * Dedicated audit logging listener that records deletion events.
 */
taskEvents.on('task-deleted', (task) => {
  const timestamp = new Date().toISOString();
  console.log(`[Audit Worker] 🗑️ Task deleted notification received at ${timestamp}`);
  console.log(`   Task ID    : ${task.id || task._id}`);
  console.log(`   Task Title : "${task.title || 'Untitled'}"`);
  console.log(`   User       : ${task.user || 'Unknown User'}\n`);
});

/**
 * Listener 3 (Supplementary Problem 2): 'error'
 * Essential error boundary to catch and safely log any errors thrown in event listeners
 * without crashing the Node.js server process.
 */
taskEvents.on('error', (err) => {
  const timestamp = new Date().toISOString();
  console.error(`[Event Error] ⚠️ Error caught in TaskEvents pipeline at ${timestamp}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
});

console.log('[TaskEvents] Event listeners registered successfully (task-created, task-deleted, error).');

module.exports = taskEvents;
