const sendSuccess = (res, data = null, meta = null, statusCode = 200) => {
  const response = { success: true };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

const sendError = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || null,
    }
  });
};

module.exports = {
  sendSuccess,
  sendError
};
