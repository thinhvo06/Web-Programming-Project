const nodemailer = require('nodemailer');
require('dotenv').config();

const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send email helper
 */
async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || '"TDTU Note App" <noreply@tdtu.edu.vn>';

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      });
      console.log(`[Mailer] Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[Mailer] Error sending email to ${to}:`, error.message);
      // Fallback log
      logFallbackEmail(to, subject, html);
      return { success: false, error: error.message };
    }
  } else {
    logFallbackEmail(to, subject, html);
    return { success: true, mocked: true };
  }
}

function logFallbackEmail(to, subject, html) {
  console.log('====================================================');
  console.log(`[MOCK EMAIL SERVICE] To: ${to}`);
  console.log(`[MOCK EMAIL SERVICE] Subject: ${subject}`);
  console.log(`[MOCK EMAIL SERVICE] Content Preview:\n${html.replace(/<[^>]+>/g, ' ').substring(0, 300)}...`);
  console.log('====================================================');
}

/**
 * Send account activation email
 */
async function sendActivationEmail(user, activationToken) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const activationLink = `${frontendUrl}/activate/${activationToken}`;
  const subject = '[TDTU Note App] Kích hoạt tài khoản của bạn';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #003366; text-align: center;">Chào mừng bạn đến với TDTU Note App!</h2>
      <p>Xin chào <strong>${user.display_name}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản. Để kích hoạt tài khoản và xóa thông báo xác thực, vui lòng nhấn vào nút bên dưới:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${activationLink}" style="background-color: #003366; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Kích hoạt tài khoản ngay
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Hoặc bạn có thể sao chép liên kết sau vào trình duyệt:</p>
      <p style="font-size: 12px; word-break: break-all; color: #2563eb;"><a href="${activationLink}">${activationLink}</a></p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Đại học Tôn Đức Thắng - Khoa Công nghệ Thông tin - Môn Lập trình & Ứng dụng Web</p>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject,
    html,
    text: `Xin chào ${user.display_name}, vui lòng kích hoạt tài khoản tại: ${activationLink}`
  });
}

/**
 * Send password reset email (OTP + Link)
 */
async function sendPasswordResetEmail(user, otp, resetToken) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
  const subject = '[TDTU Note App] Yêu cầu khôi phục mật khẩu';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #dc2626; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
      <p>Xin chào <strong>${user.display_name}</strong>,</p>
      <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${user.email}</strong>.</p>
      <p>Mã OTP xác thực của bạn là (có hiệu lực trong 15 phút):</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #f1f5f9; padding: 10px 20px; border-radius: 6px; color: #003366; border: 1px dashed #cbd5e1;">
          ${otp}
        </span>
      </div>
      <p>Hoặc bạn có thể truy cập trực tiếp đường link sau để nhập mật khẩu mới:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #dc2626; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Đại học Tôn Đức Thắng - 503073 Web Programming</p>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject,
    html,
    text: `Mã OTP khôi phục mật khẩu của bạn là: ${otp}. Hoặc truy cập link: ${resetLink}`
  });
}

/**
 * Send note shared notification email
 */
async function sendNoteSharedEmail(recipient, owner, note, permission) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const noteLink = `${frontendUrl}/notes?noteId=${note.id}`;
  const permText = permission === 'edit' ? 'Chỉnh sửa (Edit)' : 'Chỉ xem (Read-only)';
  const subject = `[TDTU Note App] ${owner.display_name} đã chia sẻ ghi chú với bạn`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #003366; text-align: center;">Ghi chú mới được chia sẻ</h2>
      <p>Xin chào <strong>${recipient.display_name}</strong>,</p>
      <p>Người dùng <strong>${owner.display_name}</strong> (${owner.email}) vừa chia sẻ một ghi chú cho bạn:</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #003366; padding: 12px 16px; margin: 15px 0; border-radius: 0 6px 6px 0;">
        <h3 style="margin: 0 0 8px 0; color: #0f172a;">${note.title}</h3>
        <p style="margin: 0; color: #475569; font-size: 13px;">Quyền hạn được cấp: <strong style="color: ${permission === 'edit' ? '#16a34a' : '#2563eb'};">${permText}</strong></p>
      </div>
      <p>Bạn có thể vào mục <strong>"Shared with me"</strong> trong ứng dụng hoặc nhấn vào liên kết bên dưới:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${noteLink}" style="background-color: #003366; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Xem ghi chú ngay
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Đại học Tôn Đức Thắng - 503073 Web Programming</p>
    </div>
  `;

  return sendMail({
    to: recipient.email,
    subject,
    html,
    text: `${owner.display_name} đã chia sẻ ghi chú "${note.title}" với quyền ${permText}. Xem tại: ${noteLink}`
  });
}

module.exports = {
  sendMail,
  sendActivationEmail,
  sendPasswordResetEmail,
  sendNoteSharedEmail
};
