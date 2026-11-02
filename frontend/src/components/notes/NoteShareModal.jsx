import React, { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { CustomSelect } from '../common/CustomSelect';
import { Trash2, Loader2, Users } from 'lucide-react';

export function NoteShareModal() {
  const { notes, noteToShare, setNoteToShare, shareNote, revokeShare } = useNotes();
  const { showSuccess, showError } = useToast();

  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!noteToShare) return null;

  // Luôn lấy phiên bản mới nhất của note từ state notes trong context
  const activeNote = notes.find((n) => n.id === noteToShare.id) || noteToShare;
  const currentShares = activeNote.sharedWith || [];

  const handleAddShare = async (e) => {
    e.preventDefault();
    const email = recipientEmail.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError('Địa chỉ email không hợp lệ');
      return;
    }

    try {
      setIsSubmitting(true);
      await shareNote(noteToShare.id, email, permission);
      showSuccess(`Đã chia sẻ cho ${email}`);
      setRecipientEmail('');
    } catch (err) {
      showError(err.message || 'Không thể chia sẻ ghi chú');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (email) => {
    try {
      await revokeShare(noteToShare.id, email);
      showSuccess(`Đã thu hồi quyền của ${email}`);
    } catch (err) {
      showError(err.message || 'Không thể thu hồi quyền');
    }
  };

  const handleChangePermission = async (email, newPerm) => {
    try {
      await shareNote(noteToShare.id, email, newPerm);
      showSuccess('Đã cập nhật quyền');
    } catch (err) {
      showError(err.message || 'Không thể cập nhật quyền');
    }
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
          Chia sẻ ghi chú: <strong>"{activeNote.title || 'không tiêu đề'}"</strong>
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
              disabled={isSubmitting}
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <CustomSelect
              value={permission}
              onChange={setPermission}
              disabled={isSubmitting}
              options={[
                { value: 'read', label: 'Chỉ xem' },
                { value: 'edit', label: 'Chỉnh sửa' },
              ]}
              size="md"
              className="w-28"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
            >
              {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{isSubmitting ? 'Đang gửi...' : 'Chia sẻ'}</span>
            </button>
          </div>
        </form>

        {/* Danh sách người được chia sẻ */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label className="block text-xs font-medium text-zinc-500 mb-2 flex items-center justify-between">
            <span>Danh sách người nhận</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded text-[11px]">
              {currentShares.length} người
            </span>
          </label>

          {currentShares.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3 italic text-center">
              Chưa chia sẻ cho ai.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {currentShares.map((share, idx) => (
                <div
                  key={share.id || share.email || idx}
                  className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/80 rounded border border-zinc-200 dark:border-zinc-700 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="truncate text-zinc-800 dark:text-zinc-200 font-medium block">
                      {share.email}
                    </span>
                    {share.sharedAt && (
                      <span className="text-[10px] text-zinc-400">
                        {new Date(share.sharedAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <CustomSelect
                      value={share.permission}
                      onChange={(newPerm) => handleChangePermission(share.email, newPerm)}
                      options={[
                        { value: 'read', label: 'Chỉ xem' },
                        { value: 'edit', label: 'Chỉnh sửa' },
                      ]}
                      size="xs"
                      align="right"
                    />

                    <button
                      onClick={() => handleRevoke(share.email)}
                      className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors"
                      title="Thu hồi quyền chia sẻ"
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
            className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
