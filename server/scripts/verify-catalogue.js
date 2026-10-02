require('dotenv').config();
const mongoose = require('mongoose');

async function testQuery() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require('../src/modules/products/product.model');
  const productService = require('../src/modules/products/product.service');

  const categories = await productService.getCategories();
  console.log(`Aggregated Departments (${categories.length}):`, categories.map(c => `${c.name} (${c.subcategories.length} subcategories)`));

  const sampleSearch = await productService.listProducts({ limit: 5 });
  console.log(`Sample Products Query (${sampleSearch.products.length}):`);
  sampleSearch.products.forEach(p => {
    console.log(`- [${p.category.l1} > ${p.category.l2}] ${p.title} | $${p.basePrice} | ★${p.ratingAvg} (${p.ratingCount} reviews)`);
  });

  await mongoose.disconnect();
}

testQuery().catch(console.error);
