const { z } = require('zod');

const addressBody = z.object({
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().optional().default(false)
});

const addAddressSchema = z.object({
  body: addressBody
});

const updateAddressSchema = z.object({
  params: z.object({
    addressId: z.string().min(1, 'Address ID is required')
  }),
  body: addressBody.partial()
});

const deleteAddressSchema = z.object({
  params: z.object({
    addressId: z.string().min(1, 'Address ID is required')
  })
});

module.exports = {
  addAddressSchema,
  updateAddressSchema,
  deleteAddressSchema
};
