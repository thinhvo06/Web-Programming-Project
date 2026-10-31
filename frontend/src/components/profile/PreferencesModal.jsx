import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { NOTE_COLORS } from '../../services/mockData';

export function PreferencesModal({ isOpen, onClose }) {
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const { showSuccess } = useToast();

  if (!isOpen) return null;

  const fontOptions = [
    { id: 'small', label: 'Nhỏ' },
    { id: 'medium', label: 'Vừa (Mặc định)' },
    { id: 'large', label: 'Lớn' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cài đặt hiển thị" maxWidth="max-w-sm">
      <div className="space-y-4">
        {/* 1. Light / Dark mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Giao diện
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setTheme('light');
                showSuccess('Đã đổi sang giao diện Sáng');
              }}
              className={`p-2 rounded border text-xs font-medium text-center transition-colors ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Giao diện Sáng
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                showSuccess('Đã đổi sang giao diện Tối');
              }}
              className={`p-2 rounded border text-xs font-medium text-center transition-colors ${
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-950/40 text-blue-300'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Giao diện Tối
            </button>
          </div>
        </div>

        {/* 2. Cỡ chữ ghi chú (Tiêu chí 8) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Cỡ chữ ghi chú
          </label>
          <div className="grid grid-cols-3 gap-2">
            {fontOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setFontSize(opt.id);
                  showSuccess(`Đã chuyển cỡ chữ sang ${opt.label}`);
                }}
                className={`p-2 rounded border text-xs font-medium text-center transition-colors ${
                  fontSize === opt.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Bảng màu khả dụng */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
            Màu thẻ ghi chú hỗ trợ ({NOTE_COLORS.length} màu)
          </label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {NOTE_COLORS.map((c) => (
              <div
                key={c.id}
                className={`w-6 h-6 rounded border ${c.bgLight} ${c.border}`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
