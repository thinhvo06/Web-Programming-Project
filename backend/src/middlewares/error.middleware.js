function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Kích thước file vượt quá giới hạn cho phép.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi hệ thống trên máy chủ.'
  });
}

module.exports = errorHandler;
