const Cart = require('./cart.model');
const Product = require('../products/product.model');

class CartService {
  async getOrCreateCart(userId, guestId) {
    if (!userId && !guestId) {
      const error = new Error('User identity or guestId required');
      error.statusCode = 400;
      error.code = 'IDENTITY_REQUIRED';
      throw error;
    }

    const query = userId ? { userId } : { guestId, userId: null };
    let cart = await Cart.findOne(query);

    if (!cart) {
      cart = new Cart(userId ? { userId, items: [] } : { guestId, items: [] });
      await cart.save();
    }

    return cart;
  }

  async getCart(userId, guestId) {
    const cart = await this.getOrCreateCart(userId, guestId);
    
    // Compute total & item counts
    const subtotal = cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.qty, 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0);

    return {
      id: cart._id,
      userId: cart.userId,
      guestId: cart.guestId,
      items: cart.items,
      subtotal: Number(subtotal.toFixed(2)),
      totalItems,
      updatedAt: cart.updatedAt
    };
  }

  async addItem(userId, guestId, { productId, sku, qty = 1 }) {
    const product = await Product.findById(productId);
    if (!product || product.status !== 'published') {
      const error = new Error('Product not available');
      error.statusCode = 404;
      error.code = 'PRODUCT_UNAVAILABLE';
      error.isOperational = true;
      throw error;
    }

    // Resolve variant: find by provided SKU, or default to first variant
    const variant = sku && sku !== 'DEFAULT'
      ? (product.variants.find((v) => v.sku === sku) || product.variants[0])
      : product.variants[0];

    if (!variant) {
      const error = new Error(`No available variants for product '${product.title}'`);
      error.statusCode = 404;
      error.code = 'VARIANT_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    const resolvedSku = variant.sku;

    if (variant.stock < qty) {
      const error = new Error(`Insufficient stock. Only ${variant.stock} available.`);
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_STOCK';
      error.isOperational = true;
      throw error;
    }

    const cart = await this.getOrCreateCart(userId, guestId);
    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString() && item.sku === resolvedSku
    );

    const price = variant.price;
    const image = variant.images?.[0] || product.images?.[0] || '';

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].qty + Number(qty);
      if (variant.stock < newQty) {
        const error = new Error(`Cannot add more. Total in cart would exceed stock (${variant.stock})`);
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_STOCK';
        throw error;
      }
      cart.items[existingIndex].qty = newQty;
      cart.items[existingIndex].priceSnapshot = price; // update price snapshot
    } else {
      cart.items.push({
        productId,
        sku: resolvedSku,
        title: product.title,
        image,
        qty: Number(qty),
        priceSnapshot: price
      });
    }

    await cart.save();
    return await this.getCart(userId, guestId);
  }

  async updateItemQty(userId, guestId, itemId, qty) {
    const cart = await this.getOrCreateCart(userId, guestId);
    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId.toString());

    if (itemIndex === -1) {
      const error = new Error('Cart item not found');
      error.statusCode = 404;
      error.code = 'ITEM_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    if (Number(qty) <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Re-verify stock
      const item = cart.items[itemIndex];
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find((v) => v.sku === item.sku);
        if (variant && variant.stock < Number(qty)) {
          const error = new Error(`Only ${variant.stock} units available`);
          error.statusCode = 400;
          error.code = 'INSUFFICIENT_STOCK';
          throw error;
        }
      }
      cart.items[itemIndex].qty = Number(qty);
    }

    await cart.save();
    return await this.getCart(userId, guestId);
  }

  async removeItem(userId, guestId, itemId) {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId.toString());
    await cart.save();
    return await this.getCart(userId, guestId);
  }

  async clearCart(userId, guestId) {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = [];
    await cart.save();
    return await this.getCart(userId, guestId);
  }

  /**
   * Cart merge on login (CART-FR-01)
   * Merges guest items into logged-in user cart without duplicates
   */
  async mergeGuestCart(userId, guestId) {
    if (!userId || !guestId) return null;

    const guestCart = await Cart.findOne({ guestId, userId: null });
    if (!guestCart || guestCart.items.length === 0) {
      return await this.getCart(userId, null);
    }

    const userCart = await this.getOrCreateCart(userId, null);

    for (const gItem of guestCart.items) {
      const matchIndex = userCart.items.findIndex(
        (uItem) => uItem.productId.toString() === gItem.productId.toString() && uItem.sku === gItem.sku
      );

      if (matchIndex > -1) {
        userCart.items[matchIndex].qty += gItem.qty;
      } else {
        userCart.items.push({
          productId: gItem.productId,
          sku: gItem.sku,
          title: gItem.title,
          image: gItem.image,
          qty: gItem.qty,
          priceSnapshot: gItem.priceSnapshot
        });
      }
    }

    await userCart.save();
    await Cart.deleteOne({ _id: guestCart._id });

    return await this.getCart(userId, null);
  }
}

module.exports = new CartService();
