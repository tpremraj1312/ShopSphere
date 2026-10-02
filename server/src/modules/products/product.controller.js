const productService = require('./product.service');
const { sendSuccess } = require('../../shared/response');

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.user._id, req.body);
    return sendSuccess(res, product, null, 201);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.user._id, req.params.id, req.body);
    return sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const getSellerProducts = async (req, res, next) => {
  try {
    const { products, total } = await productService.getSellerProducts(req.user._id, req.query);
    return sendSuccess(res, products, { total });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const { products, pagination } = await productService.listProducts(req.query);
    return sendSuccess(res, products, pagination);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories();
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

const getUploadUrl = async (req, res, next) => {
  try {
    const { fileName, mimeType } = req.body;
    const { getPresignedUploadUrl } = require('../../shared/upload');
    const result = await getPresignedUploadUrl(fileName, mimeType);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const getAlsoBought = async (req, res, next) => {
  try {
    const products = await productService.getAlsoBought(req.params.id, req.query.limit);
    return sendSuccess(res, products);
  } catch (error) {
    next(error);
  }
};

const getFacets = async (req, res, next) => {
  try {
    const facets = await productService.getFacets(req.query);
    return sendSuccess(res, facets);
  } catch (error) {
    next(error);
  }
};

const getSuggestions = async (req, res, next) => {
  try {
    const { q, categoryL1 } = req.query;
    const result = await productService.getSuggestions(q, categoryL1);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const compareWithAi = async (req, res, next) => {
  try {
    const { productIds, question, products: clientProducts } = req.body;
    const Product = require('./product.model');
    const { compareProductsWithAI } = require('../../shared/geminiClient');

    let productsToCompare = clientProducts || [];

    if ((!productsToCompare || productsToCompare.length === 0) && Array.isArray(productIds) && productIds.length > 0) {
      productsToCompare = await Product.find({ _id: { $in: productIds } }).lean();
    }

    const aiResult = await compareProductsWithAI({
      products: productsToCompare,
      userQuestion: question,
    });

    return sendSuccess(res, aiResult);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getProductById,
  listProducts,
  getCategories,
  getUploadUrl,
  getAlsoBought,
  getFacets,
  getSuggestions,
  compareWithAi,
};

