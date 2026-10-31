import React, { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Trash2 } from 'lucide-react';

export function NoteShareModal() {
  const { noteToShare, setNoteToShare, shareNote, revokeShare } = useNotes();
  const { showSuccess, showError } = useToast();

  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState('read');

  if (!noteToShare) return null;

  const currentShares = noteToShare.sharedWith || [];

  const handleAddShare = (e) => {
    e.preventDefault();
    const email = recipientEmail.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError('Địa chỉ email không hợp lệ');
      return;
    }

    shareNote(noteToShare.id, email, permission);
    showSuccess(`Đã chia sẻ cho ${email}`);
    setRecipientEmail('');
  };

  const handleRevoke = (email) => {
    revokeShare(noteToShare.id, email);
    showSuccess(`Đã thu hồi quyền của ${email}`);
  };

  const handleChangePermission = (email, newPerm) => {
    shareNote(noteToShare.id, email, newPerm);
    showSuccess('Đã cập nhật quyền');
  };

  return (
    <Modal
      isOpen={Boolean(noteToShare)}
      onClose={() => setNoteToShare(null)}
      title="Chia sẻ ghi chú"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">
          Chia sẻ ghi chú: <strong>"{noteToShare.title || 'không tiêu đề'}"</strong>
        </p>

        {/* Form thêm người nhận (Tiêu chí 25) */}
        <form onSubmit={handleAddShare} className="space-y-2">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Thêm người nhận
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="read">Chỉ xem</option>
              <option value="edit">Chỉnh sửa</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
            >
              Chia sẻ
            </button>
          </div>
        </form>

        {/* Danh sách người được chia sẻ */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label className="block text-xs font-medium text-zinc-500 mb-2">
            Danh sách người nhận ({currentShares.length})
          </label>

          {currentShares.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2 italic text-center">
              Chưa chia sẻ cho ai.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {currentShares.map((share, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-xs"
                >
                  <span className="truncate text-zinc-800 dark:text-zinc-200">
                    {share.email}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <select
                      value={share.permission}
                      onChange={(e) => handleChangePermission(share.email, e.target.value)}
                      className="bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-700 dark:text-zinc-300"
                    >
                      <option value="read">Chỉ xem</option>
                      <option value="edit">Chỉnh sửa</option>
                    </select>

                    <button
                      onClick={() => handleRevoke(share.email)}
                      className="p-1 text-zinc-400 hover:text-red-600 rounded"
                      title="Thu hồi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={() => setNoteToShare(null)}
            className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
