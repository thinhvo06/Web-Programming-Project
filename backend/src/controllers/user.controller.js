const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');

/**
 * Tiêu chí 5: View Profile & Avatar
 */
async function getProfile(req, res, next) {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url || '/public/default-avatar.svg',
        is_activated: user.is_activated,
        preferences: user.preferences,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 6: Edit Profile & Avatar
 * - Cập nhật display_name
 * - Upload avatar, kiểm tra định dạng/dung lượng (xử lý qua multer)
 */
async function updateProfile(req, res, next) {
  try {
    const user = req.user;
    const { display_name } = req.body;

    if (display_name && display_name.trim().length > 0) {
      user.display_name = display_name.trim();
    }

    // If new avatar file uploaded
    if (req.file) {
      // Delete old custom avatar if exists
      if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
        const oldPath = path.resolve(__dirname, '../../', user.avatar_url.substring(1));
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.warn('Could not delete old avatar:', e.message);
          }
        }
      }
      user.avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin trang cá nhân thành công!',
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
 * Tiêu chí 7: Change Password
 * - Kiểm tra mật khẩu hiện tại
 * - Băm và lưu mật khẩu mới
 * - Xử lý session an toàn
 */
async function changePassword(req, res, next) {
  try {
    const user = req.user;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.'
      });
    }

    if (confirm_password && new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công!'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 8: User Preferences
 * - Tùy chỉnh: kích thước font chữ (small, medium, large)
 * - Bảng màu ghi chú
 * - Bật/tắt Giao diện Sáng/Tối (light/dark)
 */
async function getPreferences(req, res, next) {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      preferences: user.preferences
    });
  } catch (error) {
    next(error);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const user = req.user;
    const currentPrefs = user.preferences || {};
    const { fontSize, noteColor, theme } = req.body;

    const updatedPrefs = {
      ...currentPrefs,
      ...(fontSize ? { fontSize } : {}),
      ...(noteColor ? { noteColor } : {}),
      ...(theme ? { theme } : {})
    };

    user.preferences = updatedPrefs;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật tùy biến người dùng thành công!',
      preferences: user.preferences
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences
};
