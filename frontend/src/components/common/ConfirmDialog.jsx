import React from 'react';
import { Modal } from './Modal';
import { AlertCircle } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn xóa không? Thao tác này không thể hoàn tác.',
  confirmText = 'Xóa',
  cancelText = 'Hủy',
  isDanger = true,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" showClose={false}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded shrink-0 ${isDanger ? 'text-red-600 bg-red-50 dark:bg-red-950/40' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'}`}>
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {title}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-3 py-1.5 text-xs font-medium text-white rounded transition-colors ${
            isDanger
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
