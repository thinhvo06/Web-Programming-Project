import React, { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';

export function NotePasswordModal() {
  const {
    lockedNotePrompt,
    setLockedNotePrompt,
    unlockNoteWithPassword,
    openEditNote,
    setNoteToDelete,
    setNoteToShare
  } = useNotes();

  const { showSuccess } = useToast();
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lockedNotePrompt) return null;

  const note = lockedNotePrompt.note;
  const targetAction = lockedNotePrompt.targetAction || 'edit';
  const openPasswordSetup = Boolean(lockedNotePrompt.openPasswordSetup);

  const handleUnlock = async (e) => {
    e.preventDefault();
    const pwd = passwordInput.trim();
    if (!pwd) {
      setErrorMsg('Vui lòng nhập mật khẩu ghi chú');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await unlockNoteWithPassword(note.id, pwd);
      if (res && res.success) {
        showSuccess('Mở khóa thành công');
        const unlockedNote = res.note || { ...note, isUnlocked: true, password: pwd };
        setLockedNotePrompt(null);
        setPasswordInput('');
        setErrorMsg('');

        if (targetAction === 'edit') {
          openEditNote(unlockedNote, openPasswordSetup);
        } else if (targetAction === 'delete') {
          setNoteToDelete(unlockedNote);
        } else if (targetAction === 'share') {
          setNoteToShare(unlockedNote);
        }
      } else {
        setErrorMsg(res?.message || 'Mật khẩu không chính xác');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Mật khẩu không chính xác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLockedNotePrompt(null);
    setPasswordInput('');
    setErrorMsg('');
  };

  const getTitle = () => {
    if (targetAction === 'delete') return 'Xác thực mật khẩu để xóa';
    if (targetAction === 'share') return 'Xác thực mật khẩu để chia sẻ';
    return 'Nhập mật khẩu ghi chú';
  };

  const getPromptMessage = () => {
    if (targetAction === 'delete') {
      return `Ghi chú "${note?.title || 'không tiêu đề'}" đang được cài mật khẩu bảo vệ. Bạn cần nhập đúng mật khẩu để xác nhận xóa.`;
    }
    if (targetAction === 'share') {
      return `Ghi chú "${note?.title || 'không tiêu đề'}" đang được cài mật khẩu bảo vệ. Bạn cần nhập đúng mật khẩu để chia sẻ.`;
    }
    return `Ghi chú "${note?.title || 'không tiêu đề'}" đã được cài mật khẩu bảo vệ.`;
  };

  const getButtonText = () => {
    if (isSubmitting) return 'Đang kiểm tra...';
    if (targetAction === 'delete') return 'Xác nhận xóa';
    if (targetAction === 'share') return 'Mở để chia sẻ';
    return 'Mở khóa';
  };

  return (
    <Modal isOpen={Boolean(lockedNotePrompt)} onClose={handleClose} maxWidth="max-w-sm" title={getTitle()}>
      <form onSubmit={handleUnlock} className="space-y-3">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {getPromptMessage()}
        </p>

        <div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Nhập mật khẩu ghi chú..."
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            disabled={isSubmitting}
          />
          {errorMsg && (
            <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded transition-colors disabled:opacity-50 ${
              targetAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {getButtonText()}
          </button>
        </div>
      </form>
    </Modal>
  );
}
