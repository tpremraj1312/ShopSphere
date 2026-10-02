const { sendError } = require('../shared/response');

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    next();
  } catch (error) {
    return sendError(res, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: error.errors
    }, 400);
  }
};

module.exports = validate;
