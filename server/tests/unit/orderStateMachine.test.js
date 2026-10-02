const { describe, it } = require('node:test');
const assert = require('node:assert');
const stateMachine = require('../../src/modules/orders/orderStateMachine');

describe('Order State Machine — Transitions & Guards (SRS 5.3)', () => {
  it('pending -> confirmed allows only "system" actor (PAY-FR-02 webhook)', () => {
    const subOrder = { status: 'pending', statusHistory: [] };

    // Disallow customer or seller from directly confirming order
    assert.throws(
      () => stateMachine.transition(subOrder, 'confirmed', { actor: 'customer', actorId: 'user123' }),
      /Actor 'customer' is not authorized/
    );
    assert.throws(
      () => stateMachine.transition(subOrder, 'confirmed', { actor: 'seller', actorId: 'seller123' }),
      /Actor 'seller' is not authorized/
    );

    // Allowed for system
    const result = stateMachine.transition(subOrder, 'confirmed', {
      actor: 'system',
      actorId: 'webhook',
      reason: 'Stripe webhook payment success'
    });

    assert.strictEqual(result.status, 'confirmed');
    assert.strictEqual(subOrder.statusHistory.length, 1);
    assert.strictEqual(subOrder.statusHistory[0].from, 'pending');
    assert.strictEqual(subOrder.statusHistory[0].to, 'confirmed');
  });

  it('confirmed -> packed allows only seller', () => {
    const subOrder = { status: 'confirmed', statusHistory: [] };

    assert.throws(
      () => stateMachine.transition(subOrder, 'packed', { actor: 'customer', actorId: 'user123' }),
      /Actor 'customer' is not authorized/
    );

    const result = stateMachine.transition(subOrder, 'packed', {
      actor: 'seller',
      actorId: 'seller123'
    });
    assert.strictEqual(result.status, 'packed');
  });

  it('packed -> shipped requires trackingNumber and seller role', () => {
    const subOrder = { status: 'packed', statusHistory: [] };

    // Fails without tracking number
    assert.throws(
      () => stateMachine.transition(subOrder, 'shipped', { actor: 'seller', actorId: 'seller123' }),
      /requires a tracking number/
    );

    // Succeeds with tracking number
    const result = stateMachine.transition(subOrder, 'shipped', {
      actor: 'seller',
      actorId: 'seller123',
      trackingNumber: 'TRACK-123456',
      carrier: 'FedEx'
    });
    assert.strictEqual(result.status, 'shipped');
    assert.strictEqual(result.trackingNumber, 'TRACK-123456');
    assert.strictEqual(result.carrier, 'FedEx');
  });

  it('customer can cancel only during pending or confirmed status (ORD-FR-04)', () => {
    const pendingSubOrder = { status: 'pending', statusHistory: [] };
    const confirmedSubOrder = { status: 'confirmed', statusHistory: [] };
    const shippedSubOrder = { status: 'shipped', statusHistory: [] };

    // Cancel pending
    stateMachine.transition(pendingSubOrder, 'cancelled', {
      actor: 'customer',
      actorId: 'user123',
      reason: 'Changed mind'
    });
    assert.strictEqual(pendingSubOrder.status, 'cancelled');

    // Cancel confirmed
    stateMachine.transition(confirmedSubOrder, 'cancelled', {
      actor: 'customer',
      actorId: 'user123'
    });
    assert.strictEqual(confirmedSubOrder.status, 'cancelled');

    // Cancel shipped should fail
    assert.throws(
      () => stateMachine.transition(shippedSubOrder, 'cancelled', { actor: 'customer', actorId: 'user123' }),
      /Invalid status transition: 'shipped' → 'cancelled'/
    );
  });

  it('blocks illegal status jumps (e.g. pending -> delivered)', () => {
    const subOrder = { status: 'pending', statusHistory: [] };
    assert.throws(
      () => stateMachine.transition(subOrder, 'delivered', { actor: 'admin', actorId: 'admin123' }),
      /Invalid status transition: 'pending' → 'delivered'/
    );
  });
});
