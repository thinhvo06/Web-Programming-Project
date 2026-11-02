import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { INITIAL_NOTES, INITIAL_LABELS } from '../services/mockData';
import {
  idbGetAll,
  idbPut,
  idbDelete,
  idbBulkPut,
  idbQueueSync,
  idbClearSyncQueue,
  queueSyncAction,
  getPendingSyncQueue,
  clearPendingSyncQueue
} from '../services/indexedDB';
import { useDebounce } from '../hooks/useDebounce';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../services/api';
import { joinNoteRoom, leaveNoteRoom, emitNoteChange, onNoteUpdated } from '../services/socket';

const NoteContext = createContext(null);

function formatBackendNote(n) {
  const isLocked = Boolean(n.is_locked);
  const isUnlocked = n.is_unlocked !== undefined ? Boolean(n.is_unlocked) : !isLocked;
  return {
    id: n.id,
    title: n.title || '',
    content: n.content || '',
    color: n.color || 'default',
    isPinned: Boolean(n.is_pinned),
    pinnedAt: n.pinned_at || null,
    isLocked: isLocked,
    isUnlocked: isUnlocked,
    password: null,
    labels: Array.isArray(n.labels)
      ? n.labels.map((l) => (typeof l === 'string' ? l : l.name))
      : [],
    attachments: (n.attachments || []).map((a) => ({
      id: a.id,
      name: a.original_name || a.file_name || 'tệp',
      type: a.file_type || 'file',
      size: a.file_size ? `${Math.round(a.file_size / 1024)} KB` : '10 KB',
      url: a.file_path ? `http://localhost:8000${a.file_path}` : ''
    })),
    sharedWith: (n.shares || []).map((s) => ({
      id: s.id,
      email: s.recipient ? s.recipient.email : s.email,
      permission: s.permission,
      sharedAt: s.shared_at
    })),
    sharedBy: n.shared_info
      ? {
          name: n.shared_info.shared_by?.display_name || 'Người dùng',
          email: n.shared_info.shared_by?.email || ''
        }
      : (n.user_role && n.user_role !== 'owner' ? { name: 'Người dùng', email: '' } : null),
    userRole: n.user_role || (n.shared_info ? n.shared_info.permission : 'owner'),
    createdAt: n.created_at || new Date().toISOString(),
    updatedAt: n.updated_at || new Date().toISOString()
  };
}

export function NoteProvider({ children }) {
  const isOnline = useOnlineStatus();
  const { isAuthenticated } = useAuth();

  const { showSuccess } = useToast();
  const isSyncingRef = useRef(false);

  // Tiêu chí 31: Đồng bộ hóa dữ liệu ngoại tuyến (Offline Sync Queue) lên máy chủ khi có mạng trở lại
  const flushOfflineSyncQueue = useCallback(async () => {
    const isActuallyOnline = typeof navigator !== 'undefined' ? navigator.onLine : isOnline;
    const token = localStorage.getItem('noteapp_token');
    const hasAuth = isAuthenticated || Boolean(token);
    if (!isActuallyOnline || !hasAuth || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const queue = await getPendingSyncQueue();
      if (!queue || queue.length === 0) {
        isSyncingRef.current = false;
        return;
      }

      console.log(`[PWA Offline Sync] Phát hiện ${queue.length} tác vụ ngoại tuyến cần đồng bộ...`);

      // Nhóm tác vụ theo noteId (giữ trạng thái mới nhất cho mỗi ghi chú)
      const latestOps = new Map();
      for (const item of queue) {
        const noteId = item.payload?.id;
        if (noteId !== undefined && noteId !== null) {
          latestOps.set(String(noteId), item);
        }
      }

      let syncCount = 0;

      for (const [noteIdStr, item] of latestOps.entries()) {
        const { action, payload } = item;
        const isTempId = typeof payload.id === 'string' && payload.id.startsWith('note-');

        if (action === 'DELETE_NOTE') {
          if (!isTempId) {
            try {
              await api.deleteNote(payload.id);
              syncCount++;
            } catch (e) {
              console.warn('[Offline Sync] Lỗi xóa note trên máy chủ:', payload.id, e);
            }
          }
          await idbDelete('notes', payload.id);
        } else if (action === 'SAVE_NOTE') {
          if (isTempId) {
            // Tạo note mới trên máy chủ
            try {
              const res = await api.createNote({
                title: payload.title || 'Ghi chú không tiêu đề',
                content: payload.content || '',
                color: payload.color || 'default',
                is_pinned: Boolean(payload.isPinned),
                labels: payload.labels || []
              });

              if (res && res.success && res.note) {
                const serverNote = formatBackendNote(res.note);
                await idbDelete('notes', payload.id);
                await idbPut('notes', serverNote);
                setNotes((prev) =>
                  prev.map((n) => (String(n.id) === String(payload.id) ? serverNote : n))
                );
                setEditingNote((current) => (current && String(current.id) === String(payload.id) ? serverNote : current));
                syncCount++;
              }
            } catch (e) {
              console.warn('[Offline Sync] Lỗi tạo note mới trên máy chủ:', payload.id, e);
            }
          } else {
            // Cập nhật note có sẵn trên máy chủ
            try {
              await api.updateNote(payload.id, {
                title: payload.title,
                content: payload.content,
                color: payload.color,
                is_pinned: Boolean(payload.isPinned),
                labels: payload.labels
              });
              syncCount++;
            } catch (e) {
              console.warn('[Offline Sync] Lỗi cập nhật note trên máy chủ:', payload.id, e);
            }
          }
        }
      }

      await clearPendingSyncQueue();

      if (syncCount > 0) {
        console.log(`[PWA Offline Sync] Đã đồng bộ thành công ${syncCount} ghi chú lên máy chủ.`);
        showSuccess(`Đã tự động đồng bộ ${syncCount} ghi chú ngoại tuyến thành công!`);
      }
    } catch (err) {
      console.error('[PWA Offline Sync] Lỗi xử lý đồng bộ ngoại tuyến:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, isAuthenticated, showSuccess]);

  // Tự động kích hoạt đồng bộ khi trình duyệt khôi phục kết nối hoặc trạng thái mạng thay đổi
  useEffect(() => {
    if (isOnline && (isAuthenticated || localStorage.getItem('noteapp_token'))) {
      flushOfflineSyncQueue();
    }
  }, [isOnline, isAuthenticated, flushOfflineSyncQueue]);

  useEffect(() => {
    const onOnline = () => {
      console.log('[Network] Kết nối mạng đã khôi phục, kích hoạt đồng bộ...');
      setTimeout(() => {
        flushOfflineSyncQueue();
      }, 300);
    };
    window.addEventListener('online', onOnline);

    const timer = setInterval(() => {
      const raw = localStorage.getItem('noteapp_sync_queue');
      const onlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (raw && raw !== '[]' && onlineNow) {
        flushOfflineSyncQueue();
      }
    }, 2500);

    return () => {
      window.removeEventListener('online', onOnline);
      clearInterval(timer);
    };
  }, [flushOfflineSyncQueue]);

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

  // 1. Nạp dữ liệu từ Backend PHP (MySQL) khi online và đã đăng nhập, fallback sang IndexedDB khi offline
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isOnline && isAuthenticated) {
        // Tiêu chí 31: Đẩy dữ liệu ngoại tuyến lên trước khi tải dữ liệu mới từ máy chủ
        await flushOfflineSyncQueue();
        try {
          const [notesRes, sharedRes, labelsRes] = await Promise.all([
            api.getNotes(),
            api.getSharedWithMe(),
            api.getLabels()
          ]);

          if (isMounted) {
            let backendNotes = [];
            if (notesRes && notesRes.notes) {
              backendNotes = notesRes.notes.map(formatBackendNote);
            }

            let sharedNotes = [];
            if (sharedRes && sharedRes.notes) {
              sharedNotes = sharedRes.notes.map(formatBackendNote);
            }

            const allNotesMap = new Map();
            backendNotes.forEach((n) => allNotesMap.set(n.id, n));
            sharedNotes.forEach((n) => allNotesMap.set(n.id, n));
            const mergedNotes = Array.from(allNotesMap.values());

            let backendLabels = [];
            if (labelsRes && labelsRes.labels) {
              backendLabels = labelsRes.labels.map((l) => ({ id: l.id, name: l.name }));
            }

            // Khi API phản hồi thành công, cập nhật dữ liệu của tài khoản đó (kể cả rỗng [] cho tài khoản mới)
            if (notesRes && (notesRes.success !== undefined || Array.isArray(notesRes.notes))) {
              setNotes(mergedNotes);
              idbBulkPut('notes', mergedNotes);
            } else if (mergedNotes.length > 0) {
              setNotes(mergedNotes);
              idbBulkPut('notes', mergedNotes);
            }

            if (labelsRes && (labelsRes.success !== undefined || Array.isArray(labelsRes.labels))) {
              setLabels(backendLabels);
              idbBulkPut('labels', backendLabels);
            } else if (backendLabels.length > 0) {
              setLabels(backendLabels);
              idbBulkPut('labels', backendLabels);
            }
            return;
          }
        } catch (err) {
          console.warn('Không thể nạp dữ liệu từ Backend PHP, chuyển sang IndexedDB/Cache:', err);
        }
      }

      // Fallback sang IndexedDB khi offline hoặc API lỗi
      try {
        const idbNotes = await idbGetAll('notes');
        const idbLabels = await idbGetAll('labels');
        if (isMounted) {
          if (idbNotes && idbNotes.length > 0) {
            setNotes(idbNotes);
          } else {
            setNotes(INITIAL_NOTES);
          }
          if (idbLabels && idbLabels.length > 0) {
            setLabels(idbLabels);
          } else {
            setLabels(INITIAL_LABELS);
          }
        }
      } catch (err) {
        console.warn('Lỗi đọc IndexedDB:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isOnline]);

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
            String(n.id) === String(data.noteId)
              ? {
                  ...n,
                  title: data.title ?? n.title,
                  content: data.content ?? n.content,
                  updatedAt: new Date().toISOString()
                }
              : n
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
      isUnlocked: true,
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

    // 1. Cập nhật local state và IndexedDB ngay lập tức để giao diện mượt
    setNotes((prevNotes) => {
      const exists = prevNotes.some((n) => String(n.id) === String(updatedNote.id));
      if (exists) {
        return prevNotes.map((n) => (String(n.id) === String(updatedNote.id) ? updatedNote : n));
      } else {
        return [updatedNote, ...prevNotes];
      }
    });

    try {
      await idbPut('notes', updatedNote);
      const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isCurrentlyOffline) {
        await queueSyncAction('SAVE_NOTE', updatedNote);
      }
    } catch (e) {
      console.error('Lỗi auto-save IndexedDB:', e);
    }

    // 2. Đồng bộ lên Backend PHP (MySQL) khi online và đã đăng nhập
    if (isOnline && isAuthenticated) {
      try {
        const isSharedWithMe = Boolean(updatedNote.sharedBy);
        const isTempId = typeof updatedNote.id === 'string' && updatedNote.id.startsWith('note-');
        // Không gọi createNote nếu là note được người khác chia sẻ
        if (!isSharedWithMe && (isTempId || updatedData.isNew)) {
          const res = await api.createNote({
            title: updatedNote.title || 'Ghi chú không tiêu đề',
            content: updatedNote.content || '',
            color: updatedNote.color || 'default',
            is_pinned: updatedNote.isPinned,
            labels: updatedNote.labels || []
          });

          if (res && res.success && res.note) {
            const serverNote = formatBackendNote(res.note);
            setNotes((prev) =>
              prev.map((n) => (n.id === updatedNote.id ? serverNote : n))
            );
            await idbDelete('notes', updatedNote.id);
            await idbPut('notes', serverNote);
            setEditingNote((prev) => (prev && prev.id === updatedNote.id ? serverNote : prev));
          }
        } else {
          await api.updateNote(updatedNote.id, {
            title: updatedNote.title,
            content: updatedNote.content,
            color: updatedNote.color,
            is_pinned: updatedNote.isPinned,
            labels: updatedNote.labels
          });
        }
      } catch (err) {
        console.warn('Lỗi đồng bộ auto-save, lưu vào hàng đợi:', err);
        await queueSyncAction('SAVE_NOTE', updatedNote);
      }
    }

    setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
  }, [isOnline, isAuthenticated]);

  // Tiêu chí 13: Xóa ghi chú (có popup xác nhận)
  const confirmDeleteNote = useCallback(async () => {
    if (!noteToDelete) return;
    const targetId = noteToDelete.id;

    setNotes((prev) => prev.filter((n) => n.id !== targetId));

    try {
      await idbDelete('notes', targetId);
      const isCurrentlyOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isCurrentlyOffline) {
        await queueSyncAction('DELETE_NOTE', { id: targetId });
      }
    } catch (e) {
      console.error('Lỗi xóa note khỏi IndexedDB:', e);
    }

    if (isOnline && isAuthenticated) {
      const isTempId = typeof targetId === 'string' && targetId.startsWith('note-');
      if (!isTempId) {
        try {
          await api.deleteNote(targetId, noteToDelete.password);
        } catch (err) {
          console.warn('Lỗi xóa note, lưu vào hàng đợi:', err);
          await queueSyncAction('DELETE_NOTE', { id: targetId });
        }
      }
    }

    if (editingNote && editingNote.id === targetId) {
      closeEditor();
    }
    setNoteToDelete(null);
  }, [noteToDelete, editingNote, closeEditor, isOnline, isAuthenticated]);

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

    if (isOnline && isAuthenticated) {
      const isTempId = typeof noteId === 'string' && noteId.startsWith('note-');
      if (!isTempId) {
        try {
          await api.togglePin(noteId);
        } catch (err) {
          console.warn('Lỗi togglePin qua API:', err);
        }
      }
    }
  }, [isOnline, isAuthenticated]);

  // Tiêu chí 20: CRUD Nhãn
  const addLabel = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (labels.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) return;

    let newLabel = { id: 'lbl-' + Date.now(), name: trimmed };

    if (isOnline && isAuthenticated) {
      try {
        const res = await api.createLabel(trimmed);
        if (res && res.success && res.label) {
          newLabel = { id: res.label.id, name: res.label.name };
        }
      } catch (err) {
        console.warn('Lỗi createLabel API:', err);
      }
    }

    setLabels((prev) => [...prev, newLabel]);
  }, [labels, isOnline, isAuthenticated]);

  const renameLabel = useCallback(async (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const oldLabel = labels.find((l) => l.id === id);
    if (!oldLabel || oldLabel.name === trimmed) return;

    const oldName = oldLabel.name;

    if (isOnline && isAuthenticated) {
      const isTempId = typeof id === 'string' && id.startsWith('lbl-');
      if (!isTempId) {
        try {
          await api.renameLabel(id, trimmed);
        } catch (err) {
          console.warn('Lỗi renameLabel API:', err);
        }
      }
    }

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
  }, [labels, activeFilter, isOnline, isAuthenticated]);

  const deleteLabel = useCallback(async (id) => {
    const labelToDelete = labels.find((l) => l.id === id);
    if (!labelToDelete) return;

    const labelName = labelToDelete.name;

    if (isOnline && isAuthenticated) {
      const isTempId = typeof id === 'string' && id.startsWith('lbl-');
      if (!isTempId) {
        try {
          await api.deleteLabel(id);
        } catch (err) {
          console.warn('Lỗi deleteLabel API:', err);
        }
      }
    }

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
  }, [labels, activeFilter, isOnline, isAuthenticated]);

  // Tiêu chí 23 & 24: Khóa mật khẩu note
  const unlockNoteWithPassword = useCallback(async (noteId, inputPassword) => {
    if (isOnline && isAuthenticated) {
      const isTempId = typeof noteId === 'string' && noteId.startsWith('note-');
      if (!isTempId) {
        try {
          const res = await api.unlockNote(noteId, inputPassword);
          if (res && res.success) {
            setUnlockedNoteIds((prev) => new Set(prev).add(noteId));
            if (res.note && res.note.content) {
              setNotes((prev) =>
                prev.map((n) =>
                  n.id === noteId
                    ? { ...n, content: res.note.content, isUnlocked: true }
                    : n
                )
              );
            }
            return true;
          }
        } catch (err) {
          console.warn('Lỗi unlockNote qua API:', err);
        }
      }
    }

    const note = notes.find((n) => n.id === noteId);
    if (note && note.password === inputPassword) {
      setUnlockedNoteIds((prev) => new Set(prev).add(noteId));
      return true;
    }
    return false;
  }, [notes, isOnline, isAuthenticated]);

  const enableNotePassword = useCallback(async (noteId, newPassword) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const updated = {
            ...n,
            password: newPassword,
            isLocked: true,
            isUnlocked: true,
            updatedAt: new Date().toISOString()
          };
          idbPut('notes', updated);
          return updated;
        }
        return n;
      })
    );
    setUnlockedNoteIds((prev) => new Set(prev).add(noteId));

    if (isOnline && isAuthenticated) {
      const isTempId = typeof noteId === 'string' && noteId.startsWith('note-');
      if (!isTempId) {
        try {
          await api.lockNote(noteId, newPassword);
        } catch (err) {
          console.warn('Lỗi lockNote qua API:', err);
        }
      }
    }
  }, [isOnline, isAuthenticated]);

  const disableNotePassword = useCallback(async (noteId, currentPassword) => {
    let success = false;

    if (isOnline && isAuthenticated) {
      const isTempId = typeof noteId === 'string' && noteId.startsWith('note-');
      if (!isTempId) {
        try {
          const res = await api.disableLock(noteId, currentPassword);
          if (res && res.success) {
            success = true;
          }
        } catch (err) {
          console.warn('Lỗi disableLock qua API:', err);
        }
      }
    }

    const note = notes.find((n) => n.id === noteId);
    if (!success && note && note.password === currentPassword) {
      success = true;
    }

    if (success) {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === noteId) {
            const updated = {
              ...n,
              password: null,
              isLocked: false,
              isUnlocked: true,
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
    }
    return false;
  }, [notes, isOnline, isAuthenticated]);

  // Tiêu chí 25: Chia sẻ ghi chú
  const shareNote = useCallback(async (noteId, recipientEmail, permission = 'read') => {
    let serverShare = null;
    if (isOnline && isAuthenticated) {
      const isTempId = typeof noteId === 'string' && noteId.startsWith('note-');
      if (!isTempId) {
        try {
          const res = await api.shareNote(noteId, recipientEmail, permission);
          if (res && res.success) {
            serverShare = res.share;
          }
        } catch (err) {
          console.warn('Lỗi shareNote qua API:', err);
          throw err;
        }
      }
    }

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
            nextShares = [
              ...currentShares,
              {
                id: serverShare?.id || Date.now(),
                email: recipientEmail,
                permission,
                sharedAt: new Date().toISOString()
              }
            ];
          }
          const updated = { ...n, sharedWith: nextShares, updatedAt: new Date().toISOString() };
          idbPut('notes', updated);
          setNoteToShare((prev) => (prev && prev.id === noteId ? updated : prev));
          return updated;
        }
        return n;
      })
    );
  }, [isOnline, isAuthenticated]);

  const revokeShare = useCallback(async (noteId, recipientEmail) => {
    if (isOnline && isAuthenticated) {
      const isTempId = typeof noteId === 'string' && noteId.startsWith('note-');
      if (!isTempId) {
        try {
          await api.revokeShareByEmail(noteId, recipientEmail);
        } catch (err) {
          console.warn('Lỗi revokeShare qua API:', err);
        }
      }
    }

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const nextShares = (n.sharedWith || []).filter(
            (s) => s.email.toLowerCase() !== recipientEmail.toLowerCase()
          );
          const updated = { ...n, sharedWith: nextShares, updatedAt: new Date().toISOString() };
          idbPut('notes', updated);
          setNoteToShare((prev) => (prev && prev.id === noteId ? updated : prev));
          return updated;
        }
        return n;
      })
    );
  }, [isOnline, isAuthenticated]);

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
