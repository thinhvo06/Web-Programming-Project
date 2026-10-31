import React, { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';

export function NotePasswordModal() {
  const {
    lockedNotePrompt,
    setLockedNotePrompt,
    unlockNoteWithPassword,
    openEditNote
  } = useNotes();

  const { showSuccess } = useToast();
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!lockedNotePrompt) return null;

  const note = lockedNotePrompt.note;

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu ghi chú');
      return;
    }

    const success = unlockNoteWithPassword(note.id, passwordInput.trim());
    if (success) {
      showSuccess('Mở khóa thành công');
      const targetAction = lockedNotePrompt.targetAction;
      setLockedNotePrompt(null);
      setPasswordInput('');
      setErrorMsg('');

      if (targetAction === 'edit') {
        openEditNote(note);
      }
    } else {
      setErrorMsg('Mật khẩu không chính xác');
    }
  };

  const handleClose = () => {
    setLockedNotePrompt(null);
    setPasswordInput('');
    setErrorMsg('');
  };

  return (
    <Modal isOpen={Boolean(lockedNotePrompt)} onClose={handleClose} maxWidth="max-w-sm" title="Nhập mật khẩu ghi chú">
      <form onSubmit={handleUnlock} className="space-y-3">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Ghi chú "<strong>{note.title || 'không tiêu đề'}</strong>" đã được cài mật khẩu bảo vệ.
        </p>

        <div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Nhập mật khẩu..."
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          {errorMsg && (
            <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Mở khóa
          </button>
        </div>
      </form>
    </Modal>
  );
}
