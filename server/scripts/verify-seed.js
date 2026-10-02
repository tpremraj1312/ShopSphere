require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/modules/products/product.model');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const p = await Product.findOne({ brand: { $exists: true, $ne: '' } }).lean();
  console.log('Sample product brand:', p.brand);
  console.log('Sample specs:', JSON.stringify(p.specs, null, 2));
  
  const brandCount = await Product.countDocuments({ brand: { $exists: true, $ne: '' } });
  console.log('Products with brand:', brandCount);
  
  const specsCount = await Product.countDocuments({ specs: { $exists: true } });
  console.log('Products with specs:', specsCount);
  
  const brands = await Product.distinct('brand');
  console.log('Unique brands:', brands.length, brands.slice(0, 10));
  
  await mongoose.disconnect();
}

verify().catch(console.error);
