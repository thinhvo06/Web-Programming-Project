import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_NOTES, INITIAL_LABELS } from '../services/mockData';
import {
  idbGetAll,
  idbPut,
  idbDelete,
  idbBulkPut,
  idbQueueSync
} from '../services/indexedDB';
import { useDebounce } from '../hooks/useDebounce';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { joinNoteRoom, leaveNoteRoom, emitNoteChange, onNoteUpdated } from '../services/socket';

const NoteContext = createContext(null);

export function NoteProvider({ children }) {
  const isOnline = useOnlineStatus();

  // State danh sách notes & labels
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('noteapp_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_NOTES;
  });

  const [labels, setLabels] = useState(() => {
    const saved = localStorage.getItem('noteapp_labels');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LABELS;
  });

  // Chế độ xem: 'grid' (mặc định) | 'list' (Tiêu chí 9, 10)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('noteapp_view_mode') || 'grid';
  });

  // Bộ lọc đang chọn: 'all' | 'shared' | labelName (Tiêu chí 22, 25)
  const [activeFilter, setActiveFilter] = useState('all');

  // Lọc theo màu sắc (Tiêu chí 8) & Sắp xếp
  const [selectedColorFilter, setSelectedColorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'created' | 'title'

  // Live search từ khóa (Tiêu chí 19: Delay 300ms, không nút search)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Trạng thái modal Note Editor dùng chung (Tiêu chí 11 & 12)
  const [editingNote, setEditingNote] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Trạng thái auto-save: 'saved' | 'saving' (Tiêu chí 14)
  const [saveStatus, setSaveStatus] = useState('saved');

  // Modal xác nhận xóa note (Tiêu chí 13 - quy định đỏ)
  const [noteToDelete, setNoteToDelete] = useState(null);

  // Modal yêu cầu nhập mật khẩu cho note bị khóa (Tiêu chí 23, 24)
  const [lockedNotePrompt, setLockedNotePrompt] = useState(null);
  const [unlockedNoteIds, setUnlockedNoteIds] = useState(new Set());

  // Modal chia sẻ ghi chú (Tiêu chí 25)
  const [noteToShare, setNoteToShare] = useState(null);

  // Modal quản lý nhãn (Tiêu chí 20)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);

  // Khởi tạo và đồng bộ IndexedDB khi ứng dụng khởi động (Tiêu chí 31)
  useEffect(() => {
    async function syncFromIndexedDB() {
      try {
        const idbNotes = await idbGetAll('notes');
        const idbLabels = await idbGetAll('labels');
        if (idbNotes && idbNotes.length > 0) {
          setNotes(idbNotes);
        } else {
          await idbBulkPut('notes', INITIAL_NOTES);
          await idbBulkPut('labels', INITIAL_LABELS);
        }
        if (idbLabels && idbLabels.length > 0) {
          setLabels(idbLabels);
        }
      } catch (err) {
        console.warn('Lỗi đọc IndexedDB:', err);
      }
    }
    syncFromIndexedDB();
  }, []);

  // Lưu vào localStorage & IndexedDB mỗi khi notes thay đổi
  useEffect(() => {
    localStorage.setItem('noteapp_notes', JSON.stringify(notes));
    idbBulkPut('notes', notes).catch((err) => console.error('Lỗi ghi idb notes:', err));
  }, [notes]);

  // Lưu vào localStorage & IndexedDB mỗi khi labels thay đổi
  useEffect(() => {
    localStorage.setItem('noteapp_labels', JSON.stringify(labels));
    idbBulkPut('labels', labels).catch((err) => console.error('Lỗi ghi idb labels:', err));
  }, [labels]);

  // Lưu viewMode
  useEffect(() => {
    localStorage.setItem('noteapp_view_mode', viewMode);
  }, [viewMode]);

  // Lắng nghe WebSocket realtime updates (Tiêu chí 26)
  useEffect(() => {
    const unsubscribe = onNoteUpdated((data) => {
      if (data && data.noteId) {
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.id === data.noteId ? { ...n, title: data.title ?? n.title, content: data.content ?? n.content, updatedAt: new Date().toISOString() } : n
          )
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // Mở màn hình tạo note mới (dùng chung modal với sửa note - Tiêu chí 11, 12)
  const openCreateNote = useCallback(() => {
    const newNote = {
      id: 'note-' + Date.now(),
      title: '',
      content: '',
      color: selectedColorFilter !== 'all' ? selectedColorFilter : 'default',
      isPinned: false,
      pinnedAt: null,
      labels: activeFilter !== 'all' && activeFilter !== 'shared' ? [activeFilter] : [],
      password: null,
      isLocked: false,
      sharedWith: [],
      sharedBy: null,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNew: true,
    };
    setEditingNote(newNote);
    setIsEditorOpen(true);
  }, [activeFilter, selectedColorFilter]);

  // Mở màn hình sửa note
  const openEditNote = useCallback((note) => {
    if (note.isLocked && !unlockedNoteIds.has(note.id)) {
      setLockedNotePrompt({ note, targetAction: 'edit' });
      return;
    }
    setEditingNote({ ...note, isNew: false });
    setIsEditorOpen(true);
  }, [unlockedNoteIds]);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingNote(null);
  }, []);

  // Tiêu chí 14: Auto-save note khi gõ (TUYỆT ĐỐI KHÔNG CÓ NÚT LƯU)
  const saveNoteAuto = useCallback(async (updatedData) => {
    setSaveStatus('saving');

    const updatedNote = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
      isNew: false
    };

    setNotes((prevNotes) => {
      const exists = prevNotes.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prevNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      } else {
        return [updatedNote, ...prevNotes];
      }
    });

    try {
      await idbPut('notes', updatedNote);
      if (!isOnline) {
        await idbQueueSync('SAVE_NOTE', updatedNote);
      }
    } catch (e) {
      console.error('Lỗi auto-save IndexedDB:', e);
    }

    setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
  }, [isOnline]);

  // Tiêu chí 13: Xóa ghi chú (có popup xác nhận)
  const confirmDeleteNote = useCallback(async () => {
    if (!noteToDelete) return;
    const targetId = noteToDelete.id;

    setNotes((prev) => prev.filter((n) => n.id !== targetId));

    try {
      await idbDelete('notes', targetId);
      if (!isOnline) {
        await idbQueueSync('DELETE_NOTE', { id: targetId });
      }
    } catch (e) {
      console.error('Lỗi xóa note khỏi IndexedDB:', e);
    }

    if (editingNote && editingNote.id === targetId) {
      closeEditor();
    }
    setNoteToDelete(null);
  }, [noteToDelete, editingNote, closeEditor, isOnline]);

  // Tiêu chí 17: Ghim note lên đầu
  const togglePinNote = useCallback(async (noteId, e) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const nextPinned = !n.isPinned;
          const updated = {
            ...n,
            isPinned: nextPinned,
            pinnedAt: nextPinned ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString()
          };
          idbPut('notes', updated);
          return updated;
        }
        return n;
      })
    );
  }, []);

  // Tiêu chí 20: CRUD Nhãn
  const addLabel = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (labels.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) return;

    const newLabel = { id: 'lbl-' + Date.now(), name: trimmed };
    setLabels((prev) => [...prev, newLabel]);
  }, [labels]);

  const renameLabel = useCallback((id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const oldLabel = labels.find((l) => l.id === id);
    if (!oldLabel || oldLabel.name === trimmed) return;

    const oldName = oldLabel.name;

    setLabels((prev) => prev.map((l) => (l.id === id ? { ...l, name: trimmed } : l)));

    // Tự động cập nhật tên mới cho tất cả note liên quan
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.labels && note.labels.includes(oldName)) {
          const updatedLabels = note.labels.map((lbl) => (lbl === oldName ? trimmed : lbl));
          return { ...note, labels: updatedLabels };
        }
        return note;
      })
    );

    if (activeFilter === oldName) {
      setActiveFilter(trimmed);
    }
  }, [labels, activeFilter]);

  const deleteLabel = useCallback((id) => {
    const labelToDelete = labels.find((l) => l.id === id);
    if (!labelToDelete) return;

    const labelName = labelToDelete.name;

    setLabels((prev) => prev.filter((l) => l.id !== id));

    // Xóa nhãn không mất note
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.labels && note.labels.includes(labelName)) {
          return { ...note, labels: note.labels.filter((lbl) => lbl !== labelName) };
        }
        return note;
      })
    );

    if (activeFilter === labelName) {
      setActiveFilter('all');
    }
  }, [labels, activeFilter]);

  // Tiêu chí 23 & 24: Khóa mật khẩu note
  const unlockNoteWithPassword = useCallback((noteId, inputPassword) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return false;

    if (note.password === inputPassword) {
      setUnlockedNoteIds((prev) => new Set(prev).add(noteId));
      return true;
    }
    return false;
  }, [notes]);

  const enableNotePassword = useCallback((noteId, newPassword) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const updated = {
            ...n,
            password: newPassword,
            isLocked: true,
            updatedAt: new Date().toISOString()
          };
          idbPut('notes', updated);
          return updated;
        }
        return n;
      })
    );
    setUnlockedNoteIds((prev) => new Set(prev).add(noteId));
  }, []);

  const disableNotePassword = useCallback((noteId, currentPassword) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.password !== currentPassword) {
      return false;
    }
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const updated = {
            ...n,
            password: null,
            isLocked: false,
            updatedAt: new Date().toISOString()
          };
          idbPut('notes', updated);
          return updated;
        }
        return n;
      })
    );
    setUnlockedNoteIds((prev) => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
    return true;
  }, [notes]);

  // Tiêu chí 25: Chia sẻ ghi chú
  const shareNote = useCallback((noteId, recipientEmail, permission = 'read') => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const currentShares = n.sharedWith || [];
          const exists = currentShares.some((s) => s.email.toLowerCase() === recipientEmail.toLowerCase());
          let nextShares;
          if (exists) {
            nextShares = currentShares.map((s) =>
              s.email.toLowerCase() === recipientEmail.toLowerCase() ? { ...s, permission } : s
            );
          } else {
            nextShares = [...currentShares, { email: recipientEmail, permission }];
          }
          const updated = { ...n, sharedWith: nextShares, updatedAt: new Date().toISOString() };
          idbPut('notes', updated);
          return updated;
        }
        return n;
      })
    );
  }, []);

  const revokeShare = useCallback((noteId, recipientEmail) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const nextShares = (n.sharedWith || []).filter(
            (s) => s.email.toLowerCase() !== recipientEmail.toLowerCase()
          );
          const updated = { ...n, sharedWith: nextShares, updatedAt: new Date().toISOString() };
          idbPut('notes', updated);
          return updated;
        }
        return n;
      })
    );
  }, []);

  // LỌC VÀ TÌM KIẾM GHI CHÚ
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // 1. Lọc theo danh mục/nhãn
    if (activeFilter === 'shared') {
      result = result.filter((n) => Boolean(n.sharedBy));
    } else if (activeFilter !== 'all') {
      result = result.filter((n) => n.labels && n.labels.includes(activeFilter));
    }

    // 2. Lọc theo màu sắc
    if (selectedColorFilter !== 'all') {
      result = result.filter((n) => (n.color || 'default') === selectedColorFilter);
    }

    // 3. Live search (300ms)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q))
      );
    }

    // 4. Sắp xếp
    if (sortBy === 'created') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      // Mặc định: theo ngày cập nhật mới nhất
      result.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }

    return result;
  }, [notes, activeFilter, selectedColorFilter, debouncedSearchQuery, sortBy]);

  // Phân chia: Note Ghim vs Note Khác
  const { pinnedNotes, otherNotes } = useMemo(() => {
    const pinned = [];
    const other = [];

    filteredNotes.forEach((n) => {
      if (n.isPinned) {
        pinned.push(n);
      } else {
        other.push(n);
      }
    });

    // Note ghim sắp xếp theo thời gian được ghim (pinned_at) mới nhất lên trước (Tiêu chí 17)
    pinned.sort((a, b) => new Date(b.pinnedAt || b.updatedAt) - new Date(a.pinnedAt || a.updatedAt));

    return { pinnedNotes: pinned, otherNotes: other };
  }, [filteredNotes]);

  return (
    <NoteContext.Provider
      value={{
        notes,
        labels,
        viewMode,
        setViewMode,
        activeFilter,
        setActiveFilter,
        selectedColorFilter,
        setSelectedColorFilter,
        sortBy,
        setSortBy,
        searchQuery,
        setSearchQuery,
        debouncedSearchQuery,
        pinnedNotes,
        otherNotes,
        totalFilteredCount: filteredNotes.length,
        editingNote,
        setEditingNote,
        isEditorOpen,
        openCreateNote,
        openEditNote,
        closeEditor,
        saveNoteAuto,
        saveStatus,
        noteToDelete,
        setNoteToDelete,
        confirmDeleteNote,
        togglePinNote,
        addLabel,
        renameLabel,
        deleteLabel,
        isLabelManagerOpen,
        setIsLabelManagerOpen,
        lockedNotePrompt,
        setLockedNotePrompt,
        unlockedNoteIds,
        unlockNoteWithPassword,
        enableNotePassword,
        disableNotePassword,
        noteToShare,
        setNoteToShare,
        shareNote,
        revokeShare,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}
