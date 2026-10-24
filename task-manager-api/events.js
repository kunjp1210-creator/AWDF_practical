const EventEmitter = require('events');

/**
 * TaskEvents - Custom EventEmitter instance for asynchronous
 * background event processing without external message queue dependencies.
 */
class TaskEvents extends EventEmitter {}

// Export singleton instance shared across the application
module.exports = new TaskEvents();
