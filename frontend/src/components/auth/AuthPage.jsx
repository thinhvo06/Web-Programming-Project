import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';

export function AuthPage() {
  const { login, register } = useAuth();
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot_email' | 'forgot_otp'
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  // Đăng nhập (Tiêu chí 3)
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidEmail(email)) {
      setErrorMessage('Địa chỉ email không đúng định dạng');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      showSuccess('Đăng nhập thành công');
    } catch (err) {
      setErrorMessage(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng ký (Tiêu chí 1)
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidEmail(email)) {
      setErrorMessage('Vui lòng nhập email hợp lệ (ví dụ: student@tdtu.edu.vn)');
      return;
    }
    if (!displayName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên hiển thị');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await register({ email, displayName: displayName.trim(), password });
      showSuccess('Đăng ký tài khoản thành công! Tự động đăng nhập.');
    } catch (err) {
      setErrorMessage(err.message || 'Đăng ký thất bại, email đã được sử dụng');
    } finally {
      setIsLoading(false);
    }
  };

  // Quên mật khẩu: Gửi OTP (Tiêu chí 4)
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidEmail(resetEmail)) {
      setErrorMessage('Vui lòng nhập email hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(resetEmail);
      showSuccess(res.message || 'Đã gửi mã OTP về email');
      setMode('forgot_otp');
    } catch (err) {
      setErrorMessage(err.message || 'Không tìm thấy tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  // Quên mật khẩu: Xác nhận OTP & Đặt mật khẩu mới (Tiêu chí 4)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otp.trim()) {
      setErrorMessage('Vui lòng nhập mã OTP');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu mới nhập lại không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword({ email: resetEmail, otp: otp.trim(), newPassword: password });
      showSuccess('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      setMode('login');
      setEmail(resetEmail);
      setPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (err) {
      setErrorMessage(err.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center px-4 py-8">
      {/* Container chính: Đơn giản, thực tế, đúng chất bài tập lớn web */}
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-blue-600 text-white mb-2 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            NoteApp
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ứng dụng Quản lý Ghi chú
          </p>
        </div>

        {/* Khung Card nội dung */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-7 shadow-xs">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. MÀN HÌNH ĐĂNG NHẬP */}
          {mode === 'login' && (
            <div>
              <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                Đăng nhập tài khoản
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_email');
                        setResetEmail(email);
                        setErrorMessage('');
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-600 dark:text-zinc-400">
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>
          )}

          {/* 2. MÀN HÌNH ĐĂNG KÝ */}
          {mode === 'register' && (
            <div>
              <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                Tạo tài khoản mới
              </h2>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@tdtu.edu.vn"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Họ và tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Mật khẩu (tối thiểu 6 ký tự)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Xác nhận lại mật khẩu
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 mt-1"
                >
                  {isLoading ? 'Đang tạo...' : 'Đăng ký tài khoản'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-600 dark:text-zinc-400">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          )}

          {/* 3. MÀN HÌNH QUÊN MẬT KHẨU (GỬI OTP) */}
          {mode === 'forgot_email' && (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-700 rounded"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                  Lấy lại mật khẩu
                </h2>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Nhập địa chỉ email đăng ký để nhận mã OTP xác nhận đặt lại mật khẩu.
              </p>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email tài khoản
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi mã OTP xác thực'}
                </button>
              </form>
            </div>
          )}

          {/* 4. MÀN HÌNH NHẬP OTP & ĐẶT MẬT KHẨU MỚI */}
          {mode === 'forgot_otp' && (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setMode('forgot_email');
                    setErrorMessage('');
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-700 rounded"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                  Xác nhận mã OTP & Mật khẩu mới
                </h2>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Mã xác thực đã được gửi tới <strong>{resetEmail}</strong> (Mã thử nghiệm: <strong>123456</strong>).
              </p>

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Mã OTP (6 chữ số)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3 py-2 text-sm text-center font-mono tracking-widest bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nhập lại mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận lại mật khẩu"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 mt-1"
                >
                  {isLoading ? 'Đang cập nhật...' : 'Đổi mật khẩu và hoàn tất'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer ghi chú môn học đơn giản */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          Khoa Công nghệ Thông tin - Trường Đại học Tôn Đức Thắng
        </p>
      </div>
    </div>
  );
}
