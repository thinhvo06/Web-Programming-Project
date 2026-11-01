import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';

export function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Tiêu chí 6: Hiển thị preview ảnh tức thì trước khi lưu
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Vui lòng chọn file hình ảnh (PNG, JPG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Dung lượng ảnh tối đa 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      showError('Tên hiển thị không được để trống');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ displayName: trimmed, avatar: avatarPreview, avatarFile });
      showSuccess('Cập nhật thông tin thành công');
      onClose();
    } catch (err) {
      showError(err.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thông tin cá nhân" maxWidth="max-w-sm">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar & Nút đổi ảnh (Tiêu chí 5, 6) */}
        <div className="flex items-center gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <Avatar src={avatarPreview} name={displayName || 'User'} size="lg" />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              Chọn ảnh mới
            </button>
            <p className="text-[11px] text-zinc-400 mt-1">PNG, JPG tối đa 2MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Email tài khoản */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Email tài khoản
          </label>
          <input
            type="text"
            value={user.email}
            disabled
            className="w-full px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-500 rounded cursor-not-allowed"
          />
        </div>

        {/* Tên hiển thị */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Tên hiển thị
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Họ và tên..."
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
