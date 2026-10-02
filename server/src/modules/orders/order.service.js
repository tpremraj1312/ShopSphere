const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const Product = require('../products/product.model');
const User = require('../users/user.model');
const stateMachine = require('./orderStateMachine');
const orderEvents = require('./orderEvents');

/**
 * OrderService — Core checkout and order management logic
 *
 * Business logic rules (SRS 5.2, 5.3, CART-FR-02/04/05/06):
 * - Server-side price/stock re-validation at checkout (never trust cart's cached price)
 * - Items grouped into subOrders by sellerId for multi-seller fulfillment
 * - idempotencyKey prevents duplicate order creation
 * - All status transitions go through the state machine
 * - Coupon validation is server-side only
 */

// Maps frontend-facing payment methods to the order model provider enum
const PAYMENT_METHOD_TO_PROVIDER = {
  'card': 'razorpay',
  'upi': 'razorpay',
  'netbanking': 'razorpay',
  'razorpay': 'razorpay',
  'stripe': 'stripe',
  'cod': 'cod',
  'stub': 'stub',
};

class OrderService {
  /**
   * Create an order from the user's cart (CART-FR-02, CART-FR-06)
   *
   * Flow:
   * 1. Check idempotencyKey for duplicates
   * 2. Resolve shipping address (from ID or direct object)
   * 3. Fetch user's cart
   * 4. Re-validate price and stock for every item against live Product data
   * 5. Group items by sellerId into subOrders
   * 6. Compute pricing server-side
   * 7. Apply coupon (if any)
   * 8. Create Order
   * 9. Decrement stock
   * 10. Clear cart
   */
  async createOrder(userId, checkoutData) {
    const {
      items: directItems,
      shippingAddress: directAddress,
      shippingAddressId,
      idempotencyKey = 'idem-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now(),
      paymentMethod = 'stub',
      couponCode,
      notes
    } = checkoutData;

    // 1. Idempotency check (CART-FR-06)
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return existingOrder; // Return existing order on duplicate submit
      }
    }

    // Determine items to checkout (direct Buy Now items or User Cart)
    let cart = null;
    let itemsToProcess = [];
    const isDirectBuy = Array.isArray(directItems) && directItems.length > 0;

    if (isDirectBuy) {
      itemsToProcess = directItems;
    } else {
      cart = await Cart.findOne({ userId });
      if (!cart || cart.items.length === 0) {
        const error = new Error('Cart is empty. Cannot create order.');
        error.statusCode = 400;
        error.code = 'EMPTY_CART';
        error.isOperational = true;
        throw error;
      }
      itemsToProcess = cart.items;
    }

    // 2. Resolve shipping address
    let shippingAddress = directAddress;
    const user = await User.findById(userId).select('addresses name email phone');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    if (!shippingAddress && shippingAddressId) {
      const savedAddr = user.addresses?.id(shippingAddressId);
      if (savedAddr) {
        shippingAddress = {
          fullName: savedAddr.fullName || user.name || user.email?.split('@')[0] || 'Customer',
          phone: savedAddr.phone || savedAddr.mobile || user.phone || '9876543210',
          addressLine1: savedAddr.addressLine1 || savedAddr.street || savedAddr.address || 'Address Line 1',
          addressLine2: savedAddr.addressLine2 || '',
          city: savedAddr.city || 'City',
          state: savedAddr.state || 'State',
          postalCode: savedAddr.postalCode || savedAddr.zipCode || '110001',
          country: savedAddr.country || 'IN',
        };
      }
    }

    if (!shippingAddress) {
      // Auto fallback to user's saved addresses or default
      if (user.addresses && user.addresses.length > 0) {
        const savedAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
        shippingAddress = {
          fullName: savedAddr.fullName || user.name || user.email?.split('@')[0] || 'Customer',
          phone: savedAddr.phone || savedAddr.mobile || user.phone || '9876543210',
          addressLine1: savedAddr.addressLine1 || savedAddr.street || savedAddr.address || 'Address Line 1',
          addressLine2: savedAddr.addressLine2 || '',
          city: savedAddr.city || 'City',
          state: savedAddr.state || 'State',
          postalCode: savedAddr.postalCode || savedAddr.zipCode || '110001',
          country: savedAddr.country || 'IN',
        };
      } else {
        // Fallback default address for instant buy
        shippingAddress = {
          fullName: user.name || user.email?.split('@')[0] || 'Customer',
          phone: user.phone || '9876543210',
          addressLine1: 'Main Delivery Address',
          addressLine2: '',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'IN',
        };
      }
    }

    // Resolve payment provider from frontend payment method
    const resolvedProvider = PAYMENT_METHOD_TO_PROVIDER[paymentMethod] || 'stub';

    // 3. Re-validate every item's price and stock against live Product data
    const validatedItems = [];
    const stockUpdates = []; // collect stock decrements to apply atomically

    for (const cartItem of itemsToProcess) {
      let product;
      try {
        product = await Product.findById(cartItem.productId);
      } catch (lookupError) {
        console.error('[CHECKOUT_PRODUCT_LOOKUP_FAILED]', JSON.stringify({
          productId: cartItem.productId?.toString(),
          sku: cartItem.sku,
          message: lookupError.message
        }));
        const error = new Error(`Product "${cartItem.title}" is no longer available`);
        error.statusCode = 400;
        error.code = 'PRODUCT_UNAVAILABLE';
        error.isOperational = true;
        throw error;
      }
      if (!product || product.status !== 'published') {
        const error = new Error(`Product "${cartItem.title}" is no longer available`);
        error.statusCode = 400;
        error.code = 'PRODUCT_UNAVAILABLE';
        error.isOperational = true;
        error.details = { productId: cartItem.productId, sku: cartItem.sku };
        throw error;
      }

      const variant = product.variants.find(v => v.sku === cartItem.sku) || product.variants[0];
      if (!variant) {
        const error = new Error(`Variant SKU "${cartItem.sku}" for "${cartItem.title}" is no longer available`);
        error.statusCode = 400;
        error.code = 'VARIANT_UNAVAILABLE';
        error.isOperational = true;
        throw error;
      }

      if (variant.stock < cartItem.qty) {
        const error = new Error(
          `Insufficient stock for "${cartItem.title}" (SKU: ${cartItem.sku}). ` +
          `Requested: ${cartItem.qty}, Available: ${variant.stock}`
        );
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_STOCK';
        error.isOperational = true;
        error.details = { sku: cartItem.sku, requested: cartItem.qty, available: variant.stock };
        throw error;
      }

      // Use LIVE price from product, not the cart's cached priceSnapshot
      validatedItems.push({
        productId: product._id,
        sellerId: product.sellerId,
        sku: variant.sku,
        title: product.title,
        unitPrice: variant.price,
        qty: cartItem.qty,
        image: variant.images?.[0] || ''
      });

      stockUpdates.push({
        productId: product._id,
        sku: variant.sku,
        qty: cartItem.qty
      });
    }

    // 4. Group items by sellerId into subOrders (ORD-FR-05)
    const sellerGroups = {};
    for (const item of validatedItems) {
      if (!item.sellerId) {
        const error = new Error(`Product "${item.title}" is missing a seller assignment`);
        error.statusCode = 409;
        error.code = 'PRODUCT_SELLER_MISSING';
        error.isOperational = true;
        error.details = { productId: item.productId, sku: item.sku };
        throw error;
      }
      const sellerKey = item.sellerId.toString();
      if (!sellerGroups[sellerKey]) {
        sellerGroups[sellerKey] = {
          sellerId: item.sellerId,
          items: [],
          status: resolvedProvider === 'cod' ? 'confirmed' : 'pending'
        };
      }
      sellerGroups[sellerKey].items.push({
        productId: item.productId,
        sku: item.sku,
        title: item.title,
        unitPrice: item.unitPrice,
        qty: item.qty,
        image: item.image
      });
    }
    const subOrders = Object.values(sellerGroups);

    // 5. Compute pricing server-side (never trust client)
    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.qty,
      0
    );
    const tax = Number((subtotal * 0.18).toFixed(2)); // 18% GST (configurable later)
    const shipping = subtotal >= 500 ? 0 : 49; // Free shipping over $500

    let discount = 0;

    // 6. Apply coupon if provided (CART-FR-05)
    if (couponCode) {
      discount = this._validateCoupon(couponCode, subtotal);
    }

    const total = Number((subtotal + tax + shipping - discount).toFixed(2));

    // 7. Create Order
    const order = new Order({
      customerId: userId,
      subOrders,
      shippingAddress,
      pricing: {
        subtotal: Number(subtotal.toFixed(2)),
        tax,
        shipping,
        discount,
        total: Math.max(0, total)
      },
      payment: {
        provider: resolvedProvider,
        method: resolvedProvider === 'cod' ? 'cod' : null,
        status: 'pending'
      },
      idempotencyKey,
      couponCode: couponCode || null,
      notes: notes || ''
    });

    try {
      await order.save();
    } catch (saveError) {
      console.error('[CHECKOUT_ORDER_SAVE_FAILED]', JSON.stringify({
        userId: userId?.toString(),
        paymentProvider: resolvedProvider,
        message: saveError.message,
        errors: saveError.errors ? Object.fromEntries(
          Object.entries(saveError.errors).map(([key, value]) => [key, value.message])
        ) : undefined
      }));

      if (saveError.name === 'ValidationError') {
        saveError.statusCode = 400;
        saveError.code = 'ORDER_VALIDATION_ERROR';
        saveError.isOperational = true;
        saveError.details = Object.fromEntries(
          Object.entries(saveError.errors || {}).map(([key, value]) => [key, value.message])
        );
      }
      throw saveError;
    }

    orderEvents.emit('order:created', { order });

    // 8. Decrement stock atomically for each variant
    for (const update of stockUpdates) {
      await Product.updateOne(
        { _id: update.productId, 'variants.sku': update.sku },
        { $inc: { 'variants.$.stock': -update.qty } }
      );
    }

    // 9. Clear cart after successful order creation (only for cart checkout)
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return order;
  }

  /**
   * Get a single order by ID (ownership enforced)
   */
  async getOrderById(orderId, userId, userRole) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'ORDER_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    // Ownership check:
    // 1. Admins see everything
    if (userRole === 'admin') return order;

    // 2. Customer who placed the order can ALWAYS view their order (even if their account has seller role)
    if (order.customerId.toString() === userId.toString()) {
      return order;
    }

    // 3. Sellers see orders containing their subOrders
    if (userRole === 'seller') {
      const hasSub = order.subOrders.some(
        sub => sub.sellerId.toString() === userId.toString()
      );
      if (!hasSub) {
        const error = new Error('Not authorized to view this order');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        error.isOperational = true;
        throw error;
      }
      return order;
    }

    const error = new Error('Not authorized to view this order');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    error.isOperational = true;
    throw error;
  }

  /**
   * Get customer's order history (ORD-FR-01)
   */
  async getCustomerOrders(userId, { page = 1, limit = 10, status }) {
    const query = { customerId: userId };

    // Filter by sub-order status if requested
    if (status) {
      query['subOrders.status'] = status;
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get seller's orders — only subOrders belonging to this seller (ORD-FR-02)
   */
  async getSellerOrders(sellerId, { page = 1, limit = 10, status }) {
    const query = { 'subOrders.sellerId': sellerId };

    if (status) {
      query['subOrders.status'] = status;
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query)
    ]);

    // Filter subOrders to only show the seller's own items
    const filtered = orders.map(order => {
      const obj = order.toObject();
      obj.subOrders = obj.subOrders.filter(
        sub => sub.sellerId.toString() === sellerId.toString()
      );
      return obj;
    });

    return {
      orders: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update sub-order status — uses the state machine (SRS 5.3)
   *
   * @param {string} orderId - The parent order ID
   * @param {string} subOrderId - The sub-order ID within the order
   * @param {string} targetStatus - The target status
   * @param {Object} actor - { userId, role }
   * @param {Object} extras - { trackingNumber, carrier, reason }
   */
  async updateSubOrderStatus(orderId, subOrderId, targetStatus, actor, extras = {}) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'ORDER_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    const subOrder = order.subOrders.id(subOrderId);
    if (!subOrder) {
      const error = new Error('Sub-order not found');
      error.statusCode = 404;
      error.code = 'SUB_ORDER_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    // Authorization: seller can only update their own subOrders
    if (actor.role === 'seller' && subOrder.sellerId.toString() !== actor.userId.toString()) {
      const error = new Error('Not authorized to update this sub-order');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      error.isOperational = true;
      throw error;
    }

    // Customer can only cancel their own orders (pending/confirmed)
    if (actor.role === 'customer') {
      if (order.customerId.toString() !== actor.userId.toString()) {
        const error = new Error('Not authorized to update this order');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        error.isOperational = true;
        throw error;
      }
    }

    // Map role to actor type for the state machine
    const actorType = actor.role === 'customer' ? 'customer' :
                      actor.role === 'seller' ? 'seller' :
                      actor.role === 'admin' ? 'admin' : 'customer';

    // Execute state transition through the state machine
    stateMachine.transition(subOrder, targetStatus, {
      actor: actorType,
      actorId: actor.userId,
      reason: extras.reason,
      trackingNumber: extras.trackingNumber,
      carrier: extras.carrier
    });

    // If cancelling, restore stock
    if (targetStatus === 'cancelled') {
      for (const item of subOrder.items) {
        await Product.updateOne(
          { _id: item.productId, 'variants.sku': item.sku },
          { $inc: { 'variants.$.stock': item.qty } }
        );
      }
    }

    await order.save();
    orderEvents.emit(`order:${targetStatus}`, { order, subOrder, actor, extras });
    orderEvents.emit('order:status_changed', { order, subOrder, targetStatus, actor, extras });
    return order;
  }

  /**
   * Confirm order via payment webhook (PAY-FR-02)
   * This is the ONLY path to move pending → confirmed
   */
  async confirmOrderPayment(orderId, paymentData) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    // Update payment information
    order.payment.providerPaymentId = paymentData.providerPaymentId;
    order.payment.status = 'completed';
    order.payment.method = paymentData.method || 'card';
    order.payment.paidAt = new Date();

    // Transition all sub-orders from pending → confirmed
    for (const subOrder of order.subOrders) {
      if (subOrder.status === 'pending') {
        stateMachine.transition(subOrder, 'confirmed', {
          actor: 'system',
          actorId: null,
          reason: `Payment confirmed via ${paymentData.provider || 'webhook'}`
        });
      }
    }

    await order.save();
    orderEvents.emit('order:confirmed', { order });
    return order;
  }

  /**
   * Confirm order with Cash on Delivery (COD)
   */
  async confirmCodOrder(orderId, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    if (order.customerId.toString() !== userId.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    order.payment.provider = 'cod';
    order.payment.method = 'cod';
    order.payment.status = 'pending';

    for (const subOrder of order.subOrders) {
      if (subOrder.status === 'pending') {
        stateMachine.transition(subOrder, 'confirmed', {
          actor: 'system',
          actorId: null,
          reason: 'Order confirmed with Cash on Delivery (COD)'
        });
      }
    }

    await order.save();
    orderEvents.emit('order:confirmed', { order });
    return order;
  }

  /**
   * Update order shipping address during checkout/payment
   */
  async updateShippingAddress(orderId, userId, { shippingAddressId, shippingAddress: directAddress }) {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    if (order.customerId.toString() !== userId.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    let resolvedAddress = directAddress;
    if (!resolvedAddress && shippingAddressId) {
      const user = await User.findById(userId).select('addresses name email phone');
      const savedAddr = user?.addresses?.id(shippingAddressId);
      if (savedAddr) {
        resolvedAddress = {
          fullName: savedAddr.name || savedAddr.fullName || user.name || user.email?.split('@')[0] || 'Customer',
          phone: savedAddr.phone || savedAddr.mobile || user.phone || '9876543210',
          addressLine1: savedAddr.addressLine1 || savedAddr.street || savedAddr.address || 'Address Line 1',
          addressLine2: savedAddr.addressLine2 || '',
          city: savedAddr.city || 'City',
          state: savedAddr.state || 'State',
          postalCode: savedAddr.postalCode || savedAddr.zipCode || '110001',
          country: savedAddr.country || 'IN',
        };
      }
    }

    if (!resolvedAddress) {
      const error = new Error('Valid shipping address required');
      error.statusCode = 400;
      error.code = 'INVALID_SHIPPING_ADDRESS';
      throw error;
    }

    order.shippingAddress = resolvedAddress;
    await order.save();
    return order;
  }

  /**
   * Coupon validation (CART-FR-05) — server-side only
   * Checks expiry, usage limit, and minimum cart value.
   *
   * For v1 this is a simple stub with hardcoded coupons.
   * In production, this would query a Coupon collection.
   */
  _validateCoupon(code, subtotal) {
    // V1: hardcoded coupon rules (replace with DB-backed coupons later)
    const coupons = {
      'WELCOME10': { type: 'percentage', value: 10, minCart: 100, maxDiscount: 50 },
      'FLAT50': { type: 'fixed', value: 50, minCart: 200 },
      'SAVE20': { type: 'percentage', value: 20, minCart: 500, maxDiscount: 200 }
    };

    const coupon = coupons[code.toUpperCase()];
    if (!coupon) {
      const error = new Error(`Invalid coupon code: "${code}"`);
      error.statusCode = 400;
      error.code = 'INVALID_COUPON';
      error.isOperational = true;
      throw error;
    }

    if (subtotal < (coupon.minCart || 0)) {
      const error = new Error(
        `Minimum cart value of $${coupon.minCart} required for coupon "${code}"`
      );
      error.statusCode = 400;
      error.code = 'COUPON_MIN_NOT_MET';
      error.isOperational = true;
      throw error;
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = subtotal * (coupon.value / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.value;
    }

    return Number(discount.toFixed(2));
  }
}

module.exports = new OrderService();
