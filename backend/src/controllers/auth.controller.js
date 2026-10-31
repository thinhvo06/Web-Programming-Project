const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { sendActivationEmail, sendPasswordResetEmail } = require('../config/mailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'tdtu_web_programming_final_project_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      display_name: user.display_name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Tiêu chí 1: User Registration
 * - Băm bcrypt
 * - Tự động đăng nhập ngay sau đăng ký thành công (cấp JWT)
 * - Gửi link kích hoạt qua email
 */
async function register(req, res, next) {
  try {
    const { email, display_name, password } = req.body;

    if (!email || !display_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email, tên hiển thị và mật khẩu.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không đúng định dạng.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự.'
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã được sử dụng. Vui lòng chọn email khác.'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create activation token
    const activationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      display_name: display_name.trim(),
      password: hashedPassword,
      is_activated: false,
      activation_token: activationToken,
      avatar_url: null,
      preferences: {
        fontSize: 'medium',
        noteColor: 'default',
        theme: 'light'
      }
    });

    // Auto login: generate JWT
    const token = generateToken(newUser);

    // Send activation email asynchronously
    sendActivationEmail(newUser, activationToken).catch(err => {
      console.error('[Register] Failed to send activation email:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Link kích hoạt đã được gửi đến email của bạn.',
      token,
      activation_token_preview: process.env.NODE_ENV !== 'production' ? activationToken : undefined,
      user: {
        id: newUser.id,
        email: newUser.email,
        display_name: newUser.display_name,
        avatar_url: newUser.avatar_url || '/public/default-avatar.svg',
        is_activated: newUser.is_activated,
        preferences: newUser.preferences
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 2: Account Activation
 * - Xác thực token từ link email
 * - Kích hoạt tài khoản, xóa banner
 */
async function activate(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã kích hoạt tài khoản.'
      });
    }

    const user = await User.findOne({ where: { activation_token: token } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Mã kích hoạt không hợp lệ hoặc tài khoản đã được kích hoạt trước đó.'
      });
    }

    user.is_activated = true;
    user.activation_token = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Tài khoản đã được kích hoạt thành công! Banner cảnh báo sẽ biến mất.',
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        is_activated: user.is_activated
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend Activation Email
 */
async function resendActivation(req, res, next) {
  try {
    const user = req.user;
    if (user.is_activated) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản của bạn đã được kích hoạt rồi.'
      });
    }

    const activationToken = crypto.randomBytes(32).toString('hex');
    user.activation_token = activationToken;
    await user.save();

    await sendActivationEmail(user, activationToken);

    return res.status(200).json({
      success: true,
      message: 'Đã gửi lại email kích hoạt tài khoản.',
      activation_token_preview: process.env.NODE_ENV !== 'production' ? activationToken : undefined
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 3: User Login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mật khẩu.'
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url || '/public/default-avatar.svg',
        is_activated: user.is_activated,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 3: User Logout
 */
async function logout(req, res) {
  // Client discards the token. Server confirms logout.
  return res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công. Token đã được hủy trên client.'
  });
}

/**
 * Tiêu chí 4: Forgot Password - Request OTP & Link
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email.'
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Don't leak user existence for security, or friendly message as assignment needs
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với địa chỉ email này.'
      });
    }

    // 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.reset_password_otp = otp;
    user.reset_password_otp_expires_at = expiresAt;
    user.reset_password_token = resetToken;
    await user.save();

    await sendPasswordResetEmail(user, otp, resetToken);

    return res.status(200).json({
      success: true,
      message: 'Mã OTP và liên kết đặt lại mật khẩu đã được gửi đến email của bạn.',
      otp_preview: process.env.NODE_ENV !== 'production' ? otp : undefined,
      reset_token_preview: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 4: Verify OTP for Password Reset
 */
async function verifyResetOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mã OTP.'
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.reset_password_otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác.'
      });
    }

    if (!user.reset_password_otp_expires_at || new Date() > user.reset_password_otp_expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mã OTP hợp lệ.',
      reset_token: user.reset_password_token
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 4: Reset Password (via OTP or Reset Token)
 * Yêu cầu: Bắt login thủ công sau reset
 */
async function resetPassword(req, res, next) {
  try {
    const { email, otp, token, new_password } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mật khẩu mới.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại.'
      });
    }

    // Verify by token or OTP
    let isValid = false;
    if (token && user.reset_password_token === token) {
      isValid = true;
    } else if (otp && user.reset_password_otp === otp) {
      if (user.reset_password_otp_expires_at && new Date() <= user.reset_password_otp_expires_at) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP hoặc liên kết xác thực không hợp lệ hoặc đã hết hạn.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    user.reset_password_otp = null;
    user.reset_password_otp_expires_at = null;
    user.reset_password_token = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  activate,
  resendActivation,
  login,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};
