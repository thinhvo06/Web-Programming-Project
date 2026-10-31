const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'tdtu_web_programming_final_project_jwt_secret_key_2026';

/**
 * Required Authentication Middleware
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu đăng nhập. Không tìm thấy token xác thực.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn.'
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc tài khoản đã bị khóa.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực hệ thống: ' + error.message
    });
  }
}

/**
 * Optional Authentication Middleware (for public or password-protected access)
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate
};
