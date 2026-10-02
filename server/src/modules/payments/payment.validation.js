const { z } = require('zod');

const createIntentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required')
  })
});

// razorpay_* fields are optional here because sandbox mode (no Razorpay keys)
// sends only orderId. The service enforces them for real payments.
const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    razorpay_order_id: z.string().optional(),
    razorpay_payment_id: z.string().optional(),
    razorpay_signature: z.string().optional()
  })
});

const refundSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required')
  }),
  body: z.object({
    amount: z.number().positive('Refund amount must be positive').optional(),
    reason: z.string().optional()
  })
});

const paymentStatusSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required')
  })
});

module.exports = {
  createIntentSchema,
  verifyPaymentSchema,
  refundSchema,
  paymentStatusSchema
};