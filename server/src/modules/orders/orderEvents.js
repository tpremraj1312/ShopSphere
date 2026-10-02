const EventEmitter = require('events');

/**
 * OrderEvents — Decoupled event bus for Order lifecycle transitions (ORD-FR-03, Step 3.4.2)
 *
 * Implements the Observer pattern:
 * When orders transition states (confirmed, shipped, delivered, cancelled),
 * this bus emits events so the notifications service can send emails and in-app alerts
 * without tight coupling or modifying the core order state machine.
 */
class OrderEventBus extends EventEmitter {}

const orderEvents = new OrderEventBus();

module.exports = orderEvents;
