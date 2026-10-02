const cartService = require('./cart.service');
const { sendSuccess } = require('../../shared/response');

const getIdentity = (req) => ({
  userId: req.user._id,
  guestId: null
});

const getCart = async (req, res, next) => {
  try {
    const { userId, guestId } = getIdentity(req);
    const cart = await cartService.getCart(userId, guestId);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { userId, guestId } = getIdentity(req);
    const cart = await cartService.addItem(userId, guestId, req.body);
    return sendSuccess(res, cart, null, 201);
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { userId, guestId } = getIdentity(req);
    const cart = await cartService.updateItemQty(userId, guestId, req.params.itemId, req.body.qty);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { userId, guestId } = getIdentity(req);
    const cart = await cartService.removeItem(userId, guestId, req.params.itemId);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const { userId, guestId } = getIdentity(req);
    const cart = await cartService.clearCart(userId, guestId);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const mergeCart = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendSuccess(res, { message: 'Guest merge requires authenticated user' }, null, 401);
    }
    const guestId = req.body.guestId || req.cookies.cart_guest_id;
    const cart = await cartService.mergeGuestCart(req.user._id, guestId);
    res.clearCookie('cart_guest_id');
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart
};
