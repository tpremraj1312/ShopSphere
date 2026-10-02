/**
 * Email Provider Service (Brevo - formerly Sendinblue, Step 3.4.1, NOT-FR-01)
 *
 * Integrates Brevo Transactional Email API with fallback to structured sandbox logging.
 * Caller signatures from Phase 1 (sendVerificationEmail, sendPasswordResetEmail) are strictly preserved.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@shopsphere.marketplace';
const SENDER_NAME = 'ShopSphere Marketplace';

/**
 * Generic email dispatcher using Brevo v3 Transactional Email API
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const isBrevoConfigured = Boolean(
    BREVO_API_KEY &&
    !BREVO_API_KEY.startsWith('mock_') &&
    !BREVO_API_KEY.includes('placeholder')
  );

  if (isBrevoConfigured) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: FROM_EMAIL },
          to: [{ email: to }],
          subject,
          htmlContent: html || `<p>${text || subject}</p>`,
          textContent: text || subject
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Brevo Error] status: ${response.status}`, errorBody);
        return { success: false, error: errorBody, provider: 'brevo' };
      }

      const resData = await response.json();
      return { success: true, messageId: resData?.messageId, provider: 'brevo' };
    } catch (err) {
      console.error('[Brevo Request Failed]', err.message);
      return { success: false, error: err.message, provider: 'brevo' };
    }
  }

  // Sandbox Mode (Development & Testing)
  console.log(`[BREVO EMAIL SANDBOX] To: ${to} | Subject: "${subject}"`);
  return { success: true, provider: 'brevo_sandbox', to, subject };
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  return await sendEmail({
    to: email,
    subject: 'Verify your ShopSphere Account',
    text: `Welcome to ShopSphere! Please verify your email using this link: ${verifyUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Welcome to ShopSphere</h2>
        <p>Thank you for registering. Please click below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">Verify Email</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">If you did not create this account, please ignore this email.</p>
      </div>
    `
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  return await sendEmail({
    to: email,
    subject: 'Reset your ShopSphere Password',
    text: `You requested a password reset. Use this link: ${resetUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>We received a request to reset your password. Click below to choose a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset Password</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">This link expires in 1 hour. If you did not request this, please secure your account.</p>
      </div>
    `
  });
};

const sendOrderConfirmedEmail = async (email, order) => {
  const orderId = order._id?.toString() || order.id;
  const total = Number(order.pricing?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const allItems = (order.subOrders || []).flatMap(s => s.items || []);
  const itemsHtml = allItems.map(item => `
    <li style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;">
      <span>${item.title} &times; ${item.qty}</span>
      <span style="font-weight: 600;">₹${Number(item.unitPrice * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </li>
  `).join('');

  const addr = order.shippingAddress || {};
  const addrText = [addr.fullName, addr.addressLine1, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ');

  return await sendEmail({
    to: email,
    subject: `Order Placed Successfully #${orderId?.slice(-6)} — ShopSphere`,
    text: `Your order #${orderId} for ₹${total} has been placed. Delivering to: ${addrText}. Track it in your ShopSphere account.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
        <h2 style="color: #0f766e; margin-top: 0;">Order Placed Successfully!</h2>
        <p>Thank you for shopping with ShopSphere. Your order <strong>#${orderId}</strong> has been placed and is being prepared.</p>
        
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #64748b;">Order Summary</h3>
          <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px;">
            ${itemsHtml}
          </ul>
          <div style="margin-top: 12px; padding-top: 8px; border-top: 2px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
            <span>Total Amount:</span>
            <span style="color: #0f172a;">₹${total}</span>
          </div>
        </div>

        ${addrText ? `<p style="font-size: 13px; color: #475569;"><strong>Delivery Address:</strong> ${addrText}</p>` : ''}
        <div style="margin-top: 24px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${orderId}" style="display: inline-block; background-color: #f59e0b; color: #000; font-weight: 600; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View Order Details</a>
        </div>
      </div>
    `
  });
};

const sendSellerOrderReceivedEmail = async (email, order, subOrder) => {
  const orderId = order._id?.toString() || order.id;
  const items = (subOrder?.items || []).map(item => `${item.title} x ${item.qty}`).join(', ');
  const address = order.shippingAddress || {};
  const addressText = [address.fullName, address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');

  return await sendEmail({
    to: email,
    subject: `New order received #${orderId?.slice(-6)} — ShopSphere`,
    text: `A new order #${orderId} contains: ${items}. Ship to: ${addressText}.`,
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #007185;">New order received</h2>
      <p>Order <strong>#${orderId}</strong> is ready for fulfillment.</p>
      <p><strong>Items:</strong> ${items}</p>
      <p><strong>Deliver to:</strong> ${addressText}</p>
      <p>Open Seller Central to review the order and update fulfillment status.</p>
    </div>`
  });
};

const sendOrderShippedEmail = async (email, order, subOrder) => {
  const orderId = order._id?.toString() || order.id;
  const tracking = subOrder.trackingNumber || 'N/A';
  const carrier = subOrder.carrier || 'Standard Courier';
  return await sendEmail({
    to: email,
    subject: `Your items have shipped! #${orderId?.slice(-6)} — ShopSphere`,
    text: `Good news! Items in your order #${orderId} have shipped via ${carrier}. Tracking: ${tracking}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Items on the Way!</h2>
        <p>Your package from order <strong>#${orderId}</strong> has been dispatched.</p>
        <p><strong>Carrier:</strong> ${carrier}</p>
        <p><strong>Tracking Number:</strong> ${tracking}</p>
      </div>
    `
  });
};

const sendOrderDeliveredEmail = async (email, order, subOrder) => {
  const orderId = order._id?.toString() || order.id;
  return await sendEmail({
    to: email,
    subject: `Package Delivered! #${orderId?.slice(-6)} — ShopSphere`,
    text: `Your order #${orderId} has been delivered. We hope you love your purchase!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981;">Delivered!</h2>
        <p>Your package from order <strong>#${orderId}</strong> has been delivered.</p>
        <p>You are now eligible to leave a verified review for your products.</p>
      </div>
    `
  });
};

const sendOrderCancelledEmail = async (email, order, reason) => {
  const orderId = order._id?.toString() || order.id;
  return await sendEmail({
    to: email,
    subject: `Order Cancelled #${orderId?.slice(-6)} — ShopSphere`,
    text: `Your order #${orderId} was cancelled. Reason: ${reason || 'Customer request'}. Any payment made will be refunded.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444;">Order Cancelled</h2>
        <p>Order <strong>#${orderId}</strong> has been cancelled.</p>
        <p><strong>Reason:</strong> ${reason || 'Customer request'}</p>
        <p>Any funds debited have been flagged for full refund processing.</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmedEmail,
  sendSellerOrderReceivedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail
};
