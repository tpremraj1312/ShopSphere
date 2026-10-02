const Product = require('./product.model');
const Order = require('../orders/order.model');

/**
 * Builds a regex pattern with single-character insertion, deletion, and substitution tolerance.
 * Handles common typos (e.g. "wirless" -> "wireless", "keyboerd" -> "keyboard", "moues" -> "mouse").
 */
function buildTypoRegex(word) {
  const clean = word.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!clean) return null;
  const patterns = [clean];
  const chars = clean.split('');

  // 1. Insertion tolerance (e.g. "wirless" matching "wireless" where an extra char was in target)
  patterns.push(chars.join('[a-zA-Z0-9]?'));

  // 2. Substitution & deletion tolerance for words >= 4 chars
  if (clean.length >= 4) {
    for (let i = 0; i < chars.length; i++) {
      // Substitution (single char wildcard)
      patterns.push(chars.slice(0, i).join('') + '.' + chars.slice(i + 1).join(''));
      // Deletion (omitted character)
      const del = chars.slice(0, i).join('') + chars.slice(i + 1).join('');
      if (del.length >= 3) patterns.push(del);
    }
  }

  return new RegExp(patterns.join('|'), 'i');
}

/**
 * Computes a relevance score for a product given search string and tokens.
 */
function scoreProductRelevance(product, searchStr, tokens) {
  let score = 0;
  const title = (product.title || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const keywords = (product.searchKeywords || []).map(k => k.toLowerCase()).join(' ');
  const q = searchStr.toLowerCase();

  // Exact phrase match in title gets highest priority
  if (title.includes(q)) score += 100;
  else if (brand && (brand.includes(q) || q.includes(brand))) score += 75;
  else if (desc.includes(q)) score += 40;

  for (const t of tokens) {
    const low = t.toLowerCase();
    if (title.includes(low)) score += 30;
    if (brand.includes(low)) score += 25;
    if (keywords.includes(low)) score += 20;
    if (desc.includes(low)) score += 10;
  }

  // Quality boost from rating average and count
  score += (product.ratingAvg || 0) * 5;
  score += Math.min(product.ratingCount || 0, 50);

  return score;
}

class ProductService {
  async createProduct(sellerId, productData) {
    let variants = productData.variants;
    if (!variants || variants.length === 0) {
      variants = [{
        sku: 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        price: Number(productData.basePrice) || 0,
        stock: 20,
        attributes: {},
        images: productData.images || []
      }];
    }
    const product = new Product({
      ...productData,
      status: productData.status || 'published',
      variants,
      sellerId
    });
    return await product.save();
  }

  async getProductById(productId) {
    const product = await Product.findById(productId).populate('sellerId', 'email');
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }
    return product;
  }

  async updateProduct(sellerId, productId, updateData) {
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    if (product.sellerId.toString() !== sellerId.toString()) {
      const error = new Error('You do not have permission to modify this product');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_OWNERSHIP';
      error.isOperational = true;
      throw error;
    }

    Object.assign(product, updateData);
    return await product.save();
  }

  async deleteProduct(sellerId, productId) {
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    if (product.sellerId.toString() !== sellerId.toString()) {
      const error = new Error('You do not have permission to delete this product');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_OWNERSHIP';
      error.isOperational = true;
      throw error;
    }

    await Product.deleteOne({ _id: productId });
    return { id: productId, deleted: true };
  }

  async getSellerProducts(sellerId, options = {}) {
    const { status, limit = 50, skip = 0 } = options;
    const query = { sellerId };
    if (status) query.status = status;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Product.countDocuments(query);
    return { products, total };
  }

  /**
   * Upgraded search & faceted filtering (CAT-FR-03, 04, Step 3.3.2, 3.3.3)
   */
  async listProducts(filters = {}) {
    const {
      categoryL1,
      categoryL2,
      categoryL3,
      minPrice,
      maxPrice,
      minRating,
      inStockOnly,
      brand,
      sort = 'newest',
      cursor,
      limit = 20,
      search
    } = filters;

    const query = { status: 'published' };

    if (categoryL1) query['category.l1'] = categoryL1;
    if (categoryL2) query['category.l2'] = categoryL2;
    if (categoryL3) query['category.l3'] = categoryL3;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.basePrice = {};
      if (minPrice !== undefined && minPrice !== '') query.basePrice.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.basePrice.$lte = Number(maxPrice);
    }

    if (minRating !== undefined && minRating !== '') {
      query.ratingAvg = { $gte: Number(minRating) };
    }

    if (inStockOnly === true || inStockOnly === 'true') {
      query['variants.stock'] = { $gt: 0 };
    }

    if (brand && brand.trim()) {
      const brandRx = new RegExp('^' + brand.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      query.$or = [
        { brand: brandRx },
        { title: new RegExp(brand.trim(), 'i') },
        { 'variants.attributes.Brand': brandRx },
        { 'variants.attributes.brand': brandRx },
        { searchKeywords: brandRx }
      ];
    }

    // Typo-tolerant search across title, brand, description, category, and keywords
    const tokens = search ? search.trim().split(/\s+/).filter(Boolean) : [];
    if (search && tokens.length > 0) {
      const tokenRegexes = tokens.map(buildTypoRegex).filter(Boolean);
      const searchConditions = tokenRegexes.map(rx => ({
        $or: [
          { title: rx },
          { brand: rx },
          { description: rx },
          { searchKeywords: rx },
          { 'category.l1': rx },
          { 'category.l2': rx },
          { 'category.l3': rx }
        ]
      }));

      if (query.$and) {
        query.$and.push(...searchConditions);
      } else {
        query.$and = searchConditions;
      }
    }

    if (cursor) {
      query._id = { $lt: cursor };
    }

    let sortObj = { _id: -1 };
    if (sort === 'price_asc') sortObj = { basePrice: 1, _id: -1 };
    else if (sort === 'price_desc') sortObj = { basePrice: -1, _id: -1 };
    else if (sort === 'rating') sortObj = { ratingAvg: -1, _id: -1 };

    const parsedLimit = Math.min(Number(limit) || 20, 100);
    let products = await Product.find(query)
      .sort(sortObj)
      .limit(parsedLimit + 1);

    // If sorting by relevance or search is active with default sort
    if ((sort === 'relevance' || (search && sort === 'newest')) && Array.isArray(products)) {
      products = [...products].sort((a, b) => {
        const scoreA = scoreProductRelevance(a, search || '', tokens);
        const scoreB = scoreProductRelevance(b, search || '', tokens);
        return scoreB - scoreA;
      });
    }

    const hasNextPage = products.length > parsedLimit;
    const results = hasNextPage ? products.slice(0, parsedLimit) : products;
    const nextCursor = hasNextPage && results.length > 0 ? results[results.length - 1]._id : null;

    return {
      products: results,
      pagination: {
        hasNextPage,
        nextCursor,
        count: results.length
      }
    };
  }

  /**
   * Facet aggregation for sidebar filters (CAT-FR-03, 04, Step 3.3.3)
   */
  async getFacets(filters = {}) {
    const { categoryL1, search } = filters;
    const match = { status: 'published' };
    if (categoryL1) match['category.l1'] = categoryL1;

    if (search) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      const tokenRegexes = tokens.map(buildTypoRegex).filter(Boolean);
      match.$and = tokenRegexes.map(rx => ({
        $or: [
          { title: rx },
          { brand: rx },
          { description: rx },
          { searchKeywords: rx },
          { 'category.l1': rx },
          { 'category.l2': rx }
        ]
      }));
    }

    const categories = await Product.aggregate([
      { $match: match },
      { $group: { _id: '$category.l1', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const brands = await Product.aggregate([
      { $match: match },
      { $match: { brand: { $exists: true, $ne: '' } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    let subcategories = [];
    if (categoryL1) {
      const subs = await Product.aggregate([
        { $match: match },
        { $match: { 'category.l2': { $exists: true, $ne: '' } } },
        { $group: { _id: '$category.l2', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      subcategories = subs.map(s => ({ name: s._id, count: s.count }));
    }

    const priceBuckets = await Product.aggregate([
      { $match: match },
      {
        $bucket: {
          groupBy: '$basePrice',
          boundaries: [0, 25, 50, 100, 200, 1000000],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const ratingBuckets = await Product.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gte: ['$ratingAvg', 4] }, then: '4plus' },
                { case: { $gte: ['$ratingAvg', 3] }, then: '3plus' },
                { case: { $gte: ['$ratingAvg', 2] }, then: '2plus' },
              ],
              default: 'under2'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      categories: categories.map(c => ({ name: c._id, count: c.count })),
      subcategories,
      brands: brands.map(b => ({ name: b._id, count: b.count })),
      priceRanges: priceBuckets,
      ratings: ratingBuckets.reduce((acc, r) => {
        acc[r._id] = r.count;
        return acc;
      }, {})
    };
  }

  /**
   * "Customers also bought / Related Products" (CAT-FR-06, Step 3.3.4)
   * High-affinity co-purchase aggregation with smart subcategory fallback
   */
  async getAlsoBought(productId, limit = 6) {
    const pId = productId.toString();
    const parsedLimit = Math.min(Number(limit) || 6, 12);

    // 1. Find orders containing this productId
    const orders = await Order.find({
      'subOrders.items.productId': pId,
      status: { $in: ['confirmed', 'shipped', 'delivered'] }
    }).lean();

    // 2. Count co-purchase occurrences
    const frequency = {};
    for (const order of orders) {
      for (const sub of (order.subOrders || [])) {
        for (const item of (sub.items || [])) {
          const itId = item.productId?.toString();
          if (itId && itId !== pId) {
            frequency[itId] = (frequency[itId] || 0) + (item.qty || 1);
          }
        }
      }
    }

    // 3. Sort by co-purchase frequency
    const topIds = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, parsedLimit);

    let alsoBought = [];
    if (topIds.length > 0) {
      alsoBought = await Product.find({
        _id: { $in: topIds },
        status: 'published'
      }).lean();
    }

    // 4. Fallback if fewer than limit co-purchased items exist: look in same subcategory first, then same department
    if (alsoBought.length < parsedLimit) {
      const currentProduct = await Product.findById(pId).lean();
      if (currentProduct) {
        let needed = parsedLimit - alsoBought.length;
        const excludeIds = [pId, ...alsoBought.map(p => p._id.toString())];

        // 4a. Same subcategory (l2)
        if (currentProduct.category?.l2) {
          const subFallback = await Product.find({
            _id: { $nin: excludeIds },
            'category.l2': currentProduct.category.l2,
            status: 'published'
          })
            .sort({ ratingAvg: -1, ratingCount: -1 })
            .limit(needed)
            .lean();

          alsoBought = [...alsoBought, ...subFallback];
          needed = parsedLimit - alsoBought.length;
          excludeIds.push(...subFallback.map(p => p._id.toString()));
        }

        // 4b. Same department (l1) if still needed
        if (needed > 0 && currentProduct.category?.l1) {
          const l1Fallback = await Product.find({
            _id: { $nin: excludeIds },
            'category.l1': currentProduct.category.l1,
            status: 'published'
          })
            .sort({ ratingAvg: -1, ratingCount: -1 })
            .limit(needed)
            .lean();

          alsoBought = [...alsoBought, ...l1Fallback];
        }
      }
    }

    return alsoBought;
  }

  async getCategories() {
    const categories = await Product.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: {
            l1: '$category.l1',
            l2: '$category.l2',
            l3: '$category.l3'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.l1': 1, '_id.l2': 1, '_id.l3': 1 } }
    ]);

    // Format into tree structure (max depth 3 per CAT-FR-01)
    const tree = {};
    for (const item of categories) {
      const { l1, l2, l3 } = item._id;
      if (!tree[l1]) tree[l1] = { name: l1, subcategories: {} };
      if (l2) {
        if (!tree[l1].subcategories[l2]) {
          tree[l1].subcategories[l2] = { name: l2, subcategories: [] };
        }
        if (l3 && !tree[l1].subcategories[l2].subcategories.includes(l3)) {
          tree[l1].subcategories[l2].subcategories.push(l3);
        }
      }
    }

    return Object.values(tree).map(c => ({
      name: c.name,
      subcategories: Object.values(c.subcategories)
    }));
  }

  /**
   * Real-time search suggestions with term completions and preview products
   */
  async getSuggestions(query, categoryL1) {
    if (!query || !query.trim()) {
      return { suggestions: [], products: [], categories: [] };
    }
    const q = query.trim();
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const filter = { status: 'published' };
    if (categoryL1) filter['category.l1'] = categoryL1;

    // 1. Direct matching products (top 4 preview)
    const products = await Product.find({
      ...filter,
      $or: [
        { title: rx },
        { brand: rx },
        { searchKeywords: rx }
      ]
    })
      .select('title basePrice brand category variants ratingAvg ratingCount images')
      .limit(4)
      .lean();

    // 2. Query completions
    const suggestionsSet = new Set();

    // Brand matches
    const brandMatches = await Product.distinct('brand', {
      ...filter,
      brand: rx
    });
    for (const b of brandMatches.slice(0, 3)) {
      if (b) suggestionsSet.add(b);
    }

    // Category matches
    const categories = await Product.distinct('category.l1', {
      'category.l1': rx,
      status: 'published'
    });

    // Extract search query phrases from product titles
    for (const p of products) {
      if (suggestionsSet.size >= 5) break;
      const words = p.title.split(' ');
      const matchIdx = words.findIndex(w => w.toLowerCase().includes(q.toLowerCase()));
      if (matchIdx !== -1) {
        const phrase = words.slice(Math.max(0, matchIdx), Math.min(words.length, matchIdx + 4)).join(' ');
        if (phrase.length > q.length) {
          suggestionsSet.add(phrase.replace(/[^\w\s-]/g, '').trim());
        }
      }
    }

    return {
      query: q,
      suggestions: Array.from(suggestionsSet).slice(0, 5),
      products: products.map(p => ({
        id: p._id,
        title: p.title,
        brand: p.brand,
        price: p.variants?.[0]?.price ?? p.basePrice ?? 0,
        image: p.variants?.[0]?.images?.[0] || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        rating: p.ratingAvg || 4.2,
        ratingCount: p.ratingCount || 0,
        category: p.category?.l1 || ''
      })),
      categories: categories.slice(0, 2)
    };
  }
}

module.exports = new ProductService();
module.exports.buildTypoRegex = buildTypoRegex;
module.exports.scoreProductRelevance = scoreProductRelevance;
