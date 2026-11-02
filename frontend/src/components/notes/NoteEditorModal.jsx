import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { NOTE_COLORS } from '../../services/mockData';
import {
  joinNoteRoom,
  leaveNoteRoom,
  emitNoteChange,
  emitUserTyping,
  emitCursorMove,
  onRoomUsers,
  onNoteUpdated,
  onCursorMoved,
  onUserTyping
} from '../../services/socket';
import { CollaboratorCaret } from './CollaboratorCaret';
import {
  X,
  Pin,
  Palette,
  Tag,
  Paperclip,
  Lock,
  Unlock,
  Check,
  Loader2,
  Trash2,
  FileText,
  Download,
  AlertCircle,
  Users,
  ListTodo,
  Share2,
  Eye,
  MousePointer2,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Bảng màu phân biệt các người dùng cùng cộng tác theo thời gian thực (Tiêu chí 26)
const COLLAB_COLORS = [
  { name: 'Xanh dương', hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/60' },
  { name: 'Xanh lá', hex: '#16a34a', bg: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/60' },
  { name: 'Tím', hex: '#9333ea', bg: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-950/60' },
  { name: 'Cam', hex: '#ea580c', bg: 'bg-amber-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/60' },
  { name: 'Hồng sen', hex: '#e11d48', bg: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-950/60' },
  { name: 'Xanh lơ', hex: '#0891b2', bg: 'bg-cyan-600', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500', lightBg: 'bg-cyan-50 dark:bg-cyan-950/60' },
  { name: 'Chàm', hex: '#4f46e5', bg: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500', lightBg: 'bg-indigo-50 dark:bg-indigo-950/60' },
  { name: 'Vàng rực', hex: '#ca8a04', bg: 'bg-yellow-600', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500', lightBg: 'bg-yellow-50 dark:bg-yellow-950/60' },
];

function getCollabColor(emailOrId) {
  if (!emailOrId) return COLLAB_COLORS[0];
  let hash = 0;
  const s = String(emailOrId);
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

export function NoteEditorModal() {
  const {
    editingNote,
    isEditorOpen,
    closeEditor,
    saveNoteAuto,
    saveStatus,
    labels,
    setNoteToDelete,
    setNoteToShare
  } = useNotes();

  const { user: currentUser } = useAuth();
  const { fontSize } = useTheme();
  const { showSuccess, showError } = useToast();

  // Danh sách con trỏ (remote pointers) của những người khác đang mở note
  const [remoteCursors, setRemoteCursors] = useState({});
  const titleCursors = Object.values(remoteCursors).filter((c) => c.field === 'title');
  const contentCursors = Object.values(remoteCursors).filter((c) => c.field === 'content');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [noteLabels, setNoteLabels] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // Socket Realtime Collaboration State (Tiêu chí 26)
  const [roomUsers, setRoomUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [currentPassForDisable, setCurrentPassForDisable] = useState('');

  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const contentAreaRef = useRef(null);
  const mouseMoveTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Kiểm tra quyền chỉ xem (Read-only)
  const isReadOnly =
    editingNote?.userRole === 'read' ||
    editingNote?.sharedBy?.permission === 'read';

  const fontClassMap = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  // 1. Khi mở NoteEditor -> tham gia WebSocket Room
  useEffect(() => {
    if (editingNote && isEditorOpen) {
      setTitle(editingNote.title || '');
      setContent(editingNote.content || '');
      setColor(editingNote.color || 'default');
      setIsPinned(Boolean(editingNote.isPinned));
      setNoteLabels(editingNote.labels || []);
      setAttachments(editingNote.attachments || []);
      setValidationError('');

      // Tham gia phòng Socket.io
      joinNoteRoom(editingNote.id, currentUser);

      // Lắng nghe người cùng phòng (Tiêu chí 26)
      const unsubRoomUsers = onRoomUsers((data) => {
        if (data && String(data.noteId) === String(editingNote.id)) {
          setRoomUsers(data.users || []);
        }
      });

      // Lắng nghe thay đổi nội dung từ người khác tức thì (Realtime Instant Sync)
      const unsubNoteUpdated = onNoteUpdated((data) => {
        if (data && String(data.noteId) === String(editingNote.id)) {
          if (data.title !== undefined) setTitle(data.title);
          if (data.content !== undefined) setContent(data.content);
        }
      });

      // Lắng nghe vị trí con trỏ (pointer/cursor) của người khác
      const unsubCursor = onCursorMoved((data) => {
        if (data && String(data.noteId) === String(editingNote.id)) {
          if (data.user?.email && data.user.email === currentUser?.email) return;
          const key = data.socketId || data.user?.id || data.user?.email;
          setRemoteCursors((prev) => ({
            ...prev,
            [key]: {
              ...data,
              color: getCollabColor(data.user?.email || data.user?.id)
            }
          }));
        }
      });

      // Lắng nghe trạng thái đang gõ
      const unsubTyping = onUserTyping((data) => {
        if (data && String(data.noteId) === String(editingNote.id)) {
          if (data.isTyping) {
            setTypingUser(data.user?.display_name || 'Người cộng tác');
          } else {
            setTypingUser(null);
          }
        }
      });

      return () => {
        leaveNoteRoom(editingNote.id);
        unsubRoomUsers();
        unsubNoteUpdated();
        unsubCursor();
        unsubTyping();
        setRoomUsers([]);
        setRemoteCursors({});
        setTypingUser(null);
      };
    }
  }, [editingNote, isEditorOpen]);

  // TIÊU CHÍ 14 (QUY ĐỊNH ĐỎ): Tự động lưu nội dung khi gõ (debounce 400ms). TUYỆT ĐỐI KHÔNG CÓ NÚT LƯU!
  const triggerAutoSave = (updatedFields) => {
    if (!editingNote || isReadOnly) return;

    // Phát sự kiện đang gõ chữ cho các client khác (Tiêu chí 26)
    emitUserTyping(editingNote.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitUserTyping(editingNote.id, false);
    }, 1500);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const payload = {
        ...editingNote,
        title: updatedFields.title !== undefined ? updatedFields.title : title,
        content: updatedFields.content !== undefined ? updatedFields.content : content,
        color: updatedFields.color !== undefined ? updatedFields.color : color,
        isPinned: updatedFields.isPinned !== undefined ? updatedFields.isPinned : isPinned,
        labels: updatedFields.noteLabels !== undefined ? updatedFields.noteLabels : noteLabels,
        attachments: updatedFields.attachments !== undefined ? updatedFields.attachments : attachments,
      };

      if (payload.title.trim() || payload.content.trim()) {
        saveNoteAuto(payload);
        // Phát realtime qua Socket cho người khác cùng xem
        emitNoteChange(editingNote.id, payload.title, payload.content);
      }
    }, 400);
  };

  // Phát vị trí con trỏ (Cursor / Pointer) và vùng bôi đen (Selection Range)
  const broadcastCursor = (field, e) => {
    if (!editingNote || isReadOnly || !e?.target) return;
    const start = e.target.selectionStart !== undefined ? e.target.selectionStart : 0;
    const end = e.target.selectionEnd !== undefined ? e.target.selectionEnd : 0;
    const direction = e.target.selectionDirection || 'forward';
    const pos = direction === 'backward' ? start : end;
    let line = 1;
    if (field === 'content' && typeof e.target.value === 'string') {
      line = e.target.value.substring(0, pos).split('\n').length;
    }
    emitCursorMove(editingNote.id, {
      field,
      position: pos,
      line,
      selectionStart: start,
      selectionEnd: end,
      selectionDirection: direction
    });
  };

  const handleMouseMoveSelection = (field, e) => {
    if (e.buttons !== 1) return;
    if (mouseMoveTimerRef.current) return;
    mouseMoveTimerRef.current = setTimeout(() => {
      mouseMoveTimerRef.current = null;
      broadcastCursor(field, e);
    }, 60);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    // 1. Đồng bộ Socket realtime tức thì cho các người dùng khác (Realtime Instant Sync)
    emitNoteChange(editingNote.id, val, content);
    broadcastCursor('title', e);
    // 2. Tự động lưu vào Database với debounce 400ms (Quy tắc đỏ)
    triggerAutoSave({ title: val });
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    // 1. Đồng bộ Socket realtime tức thì cho các người dùng khác (Realtime Instant Sync)
    emitNoteChange(editingNote.id, title, val);
    broadcastCursor('content', e);
    // 2. Tự động lưu vào Database với debounce 400ms (Quy tắc đỏ)
    triggerAutoSave({ content: val });
  };

  // Hỗ trợ chèn checklist "- [ ] " tiện lợi
  const handleInsertChecklist = () => {
    const newContent = content ? `${content}\n- [ ] ` : '- [ ] ';
    setContent(newContent);
    triggerAutoSave({ content: newContent });
  };

  const handleColorSelect = (colorId) => {
    setColor(colorId);
    setShowColorPicker(false);
    triggerAutoSave({ color: colorId });
  };

  const handleTogglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    triggerAutoSave({ isPinned: nextPin });
  };

  const handleToggleLabel = (labelName) => {
    let nextLabels;
    if (noteLabels.includes(labelName)) {
      nextLabels = noteLabels.filter((l) => l !== labelName);
    } else {
      nextLabels = [...noteLabels, labelName];
    }
    setNoteLabels(nextLabels);
    triggerAutoSave({ noteLabels: nextLabels });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      let type = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';

      const fileUrl = URL.createObjectURL(file);
      const newAtt = {
        id: 'att-' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: file.name,
        type,
        size: (file.size / 1024 > 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB'),
        url: fileUrl,
      };

      setAttachments((prev) => {
        const updated = [...prev, newAtt];
        triggerAutoSave({ attachments: updated });
        return updated;
      });
    });

    e.target.value = '';
    showSuccess('Đã thêm tệp đính kèm');
  };

  const handleRemoveAttachment = (attId) => {
    const updated = attachments.filter((a) => a.id !== attId);
    setAttachments(updated);
    triggerAutoSave({ attachments: updated });
  };

  const handleEnablePassword = (e) => {
    e.preventDefault();
    if (!pass1) {
      showError('Vui lòng nhập mật khẩu');
      return;
    }
    if (pass1 !== pass2) {
      showError('Mật khẩu xác nhận lần 2 không khớp');
      return;
    }
    const updated = {
      ...editingNote,
      password: pass1,
      isLocked: true,
      updatedAt: new Date().toISOString()
    };
    saveNoteAuto(updated);
    setShowPasswordSetup(false);
    setPass1('');
    setPass2('');
    showSuccess('Đã khóa ghi chú bằng mật khẩu');
  };

  const handleDisablePassword = (e) => {
    e.preventDefault();
    if (currentPassForDisable !== editingNote.password) {
      showError('Mật khẩu hiện tại không đúng');
      return;
    }
    const updated = {
      ...editingNote,
      password: null,
      isLocked: false,
      updatedAt: new Date().toISOString()
    };
    saveNoteAuto(updated);
    setShowPasswordSetup(false);
    setCurrentPassForDisable('');
    showSuccess('Đã gỡ bỏ mật khẩu bảo vệ');
  };

  const handleClose = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (isReadOnly) {
      closeEditor();
      return;
    }
    if (editingNote?.isNew && !title.trim() && !content.trim()) {
      closeEditor();
      return;
    }

    const hasChanged =
      editingNote?.isNew ||
      title !== (editingNote?.title || '') ||
      content !== (editingNote?.content || '') ||
      color !== (editingNote?.color || 'default') ||
      isPinned !== Boolean(editingNote?.isPinned) ||
      JSON.stringify(noteLabels) !== JSON.stringify(editingNote?.labels || []) ||
      JSON.stringify(attachments) !== JSON.stringify(editingNote?.attachments || []);

    if (hasChanged && (title.trim() || content.trim())) {
      saveNoteAuto({
        ...editingNote,
        title,
        content,
        color,
        isPinned,
        labels: noteLabels,
        attachments
      });
    }
    closeEditor();
  };

  if (!isEditorOpen || !editingNote) return null;

  const currentColorObj = NOTE_COLORS.find((c) => c.id === color) || NOTE_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={handleClose}
      />

      {/* Editor Modal Window (Dùng chung cho cả Tạo & Sửa - Tiêu chí 11 & 12) */}
      <div
        className={`relative w-full rounded-2xl shadow-2xl border transition-all duration-200 z-10 flex flex-col overflow-hidden ${isExpanded ? "max-w-6xl h-[94vh]" : "max-w-3xl md:max-w-4xl h-[86vh] min-h-[600px]"} ${currentColorObj.bgLight} ${currentColorObj.bgDark} ${currentColorObj.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            {/* Trạng thái Auto-save (Tiêu chí 14) */}
            <div className="flex items-center gap-1 text-xs text-zinc-400 select-none">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-zinc-500" />
                  <span>Đã lưu</span>
                </>
              )}
            </div>

            {/* Trạng thái và Danh sách cộng tác viên đang cùng mở note (phân biệt màu riêng - Tiêu chí 26) */}
            {roomUsers
              .filter((u) => u.email !== currentUser?.email && String(u.id) !== String(currentUser?.id))
              .map((collab) => {
                const collabColor = getCollabColor(collab.email || collab.id);
                const cursorInfo = Object.values(remoteCursors).find((c) => c.user?.email === collab.email);
                return (
                  <span
                    key={collab.id || collab.socketId}
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 border shadow-2xs transition-all ${collabColor.lightBg} ${collabColor.border} ${collabColor.text}`}
                    title={`${collab.display_name} (${collab.email})`}
                  >
                    <span className={`w-2 h-2 rounded-full animate-pulse ${collabColor.bg}`} />
                    <span>{collab.display_name}</span>
                    {cursorInfo && (
                      <span className="text-[10px] opacity-80 font-normal">
                        • {cursorInfo.field === 'title' ? 'ở Tiêu đề' : `dòng ${cursorInfo.line || 1}`}
                      </span>
                    )}
                  </span>
                );
              })}

            {/* Thông báo đang gõ chữ */}
            {typingUser && (
              <span className="text-[11px] text-blue-600 dark:text-blue-400 italic flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                {typingUser} đang soạn thảo...
              </span>
            )}

            {editingNote.sharedBy && (
              <span className="text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.2 rounded ml-1 font-medium">
                Chia sẻ bởi {editingNote.sharedBy.name || editingNote.sharedBy.email}
              </span>
            )}

            {isReadOnly && (
              <span className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.2 rounded ml-1 font-medium flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Chỉ xem</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!isReadOnly && !editingNote.isNew && (
              <button
                onClick={() => setNoteToShare(editingNote)}
                className="p-1.5 text-zinc-400 hover:text-blue-600 rounded transition-colors"
                title="Chia sẻ ghi chú này"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleTogglePin}
              className={`p-1.5 rounded transition-colors ${
                isPinned ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title={isPinned ? 'Bỏ ghim' : 'Ghim'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
              title={isExpanded ? "Thu nhỏ lại" : "Mở rộng toàn màn hình"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nội dung soạn thảo */}
        <div className="flex-1 flex flex-col overflow-y-auto p-5 sm:p-6 space-y-4">
          {validationError && (
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-900 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Vùng Tiêu đề với Con trỏ Google Sheets / Docs trực tiếp */}
          <div
            className="relative rounded-md transition-all duration-150"
            style={
              titleCursors.length > 0
                ? {
                    boxShadow: `0 0 0 2px ${titleCursors[0].color.hex}60`,
                    padding: '2px 4px',
                    margin: '-2px -4px'
                  }
                : undefined
            }
          >
            {/* Tag phong cách Google Sheets ở góc phải khi có cộng tác viên đang ở Tiêu đề */}
            {titleCursors.length > 0 && (
              <div className="absolute right-0 -top-5 flex items-center gap-1 z-20 pointer-events-none">
                {titleCursors.map((c) => (
                  <span
                    key={c.user?.id || c.socketId}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-t shadow-xs"
                    style={{ backgroundColor: c.color.hex }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{c.user?.display_name || c.user?.email}</span>
                  </span>
                ))}
              </div>
            )}

            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              onFocus={(e) => broadcastCursor('title', e)}
              onKeyUp={(e) => broadcastCursor('title', e)}
              onClick={(e) => broadcastCursor('title', e)}
              onSelect={(e) => broadcastCursor('title', e)}
              onMouseUp={(e) => broadcastCursor('title', e)}
              onMouseMove={(e) => handleMouseMoveSelection('title', e)}
              readOnly={isReadOnly}
              placeholder={isReadOnly ? "Không có tiêu đề" : "Tiêu đề..."}
              className={`w-full bg-transparent font-bold text-lg sm:text-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none ${isReadOnly ? "cursor-default select-text" : ""}`}
            />

            {/* Con trỏ Google Sheets / Docs nhấp nháy trực tiếp tại vị trí chữ của Tiêu đề */}
            {titleCursors.map((c) => (
              <CollaboratorCaret
                key={c.user?.id || c.socketId}
                targetRef={titleInputRef}
                cursor={c}
                text={title}
              />
            ))}
          </div>

          {/* Vùng Nội dung với Con trỏ Google Sheets / Docs trực tiếp */}
          <div
            className="relative flex-1 flex flex-col rounded-md transition-all duration-150 min-h-[320px]"
            style={
              contentCursors.length > 0
                ? {
                    boxShadow: `0 0 0 2px ${contentCursors[0].color.hex}60`,
                    padding: '2px 4px',
                    margin: '-2px -4px'
                  }
                : undefined
            }
          >
            {/* Tag phong cách Google Sheets ở góc phải khi có cộng tác viên đang ở Nội dung */}
            {contentCursors.length > 0 && (
              <div className="absolute right-0 -top-5 flex items-center gap-1 z-20 pointer-events-none">
                {contentCursors.map((c) => (
                  <span
                    key={c.user?.id || c.socketId}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-t shadow-xs"
                    style={{ backgroundColor: c.color.hex }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{c.user?.display_name || c.user?.email}</span>
                  </span>
                ))}
              </div>
            )}

            <textarea
              ref={contentAreaRef}
              value={content}
              onChange={handleContentChange}
              onFocus={(e) => broadcastCursor('content', e)}
              onKeyUp={(e) => broadcastCursor('content', e)}
              onClick={(e) => broadcastCursor('content', e)}
              onSelect={(e) => broadcastCursor('content', e)}
              onMouseUp={(e) => broadcastCursor('content', e)}
              onMouseMove={(e) => handleMouseMoveSelection('content', e)}
              readOnly={isReadOnly}
              placeholder={isReadOnly ? "Ghi chú trống" : "Ghi chú... (Nội dung tự động lưu khi bạn gõ)"}
              rows={isExpanded ? 18 : 11}
              className={`w-full flex-1 bg-transparent resize-none min-h-[300px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none leading-relaxed ${isReadOnly ? "cursor-default select-text" : ""} ${fontClassMap[fontSize] || fontClassMap.medium}`}
            />

            {/* Con trỏ Google Sheets / Docs nhấp nháy trực tiếp tại vị trí chữ của Nội dung */}
            {contentCursors.map((c) => (
              <CollaboratorCaret
                key={c.user?.id || c.socketId}
                targetRef={contentAreaRef}
                cursor={c}
                text={content}
              />
            ))}
          </div>

          {/* Tệp đính kèm */}
          {attachments.length > 0 && (
            <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                Tệp đính kèm ({attachments.length})
              </span>

              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded border border-black/5 dark:border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate text-zinc-800 dark:text-zinc-200 font-medium">
                        {att.name}
                      </span>
                      <span className="text-zinc-400 text-[10px] shrink-0">({att.size})</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {att.url && (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          download={att.name}
                          className="p-1 text-zinc-400 hover:text-blue-600 rounded"
                          title="Tải về"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 text-zinc-400 hover:text-red-600 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách nhãn */}
          {noteLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {noteLabels.map((lbl, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded"
                >
                  #{lbl}
                  <button
                    onClick={() => handleToggleLabel(lbl)}
                    className="hover:text-red-600 rounded"
                    title={`Gỡ nhãn ${lbl}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar chân modal (TUYỆT ĐỐI KHÔNG CÓ NÚT LƯU) */}
        <div className="px-4 py-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 bg-black/[0.02] dark:bg-white/[0.02]">
          {isReadOnly ? (
            <span className="text-xs text-zinc-400 italic flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Ghi chú ở chế độ chỉ xem. Bạn không thể chỉnh sửa.
            </span>
          ) : (
          <div className="flex items-center gap-1 relative">
            {/* Chọn màu nền */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowLabelPicker(false);
                }}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"
                title="Đổi màu nền"
              >
                <Palette className="w-4 h-4" />
              </button>

              {showColorPicker && (
                <div className="absolute bottom-full mb-1 left-0 p-1.5 bg-white dark:bg-zinc-800 rounded-md shadow-md border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 z-20">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleColorSelect(c.id)}
                      className={`w-5 h-5 rounded-full border transition-transform ${c.bgLight} ${
                        color === c.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Gắn nhãn */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLabelPicker(!showLabelPicker);
                  setShowColorPicker(false);
                }}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"
                title="Thêm nhãn"
              >
                <Tag className="w-4 h-4" />
              </button>

              {showLabelPicker && (
                <div className="absolute bottom-full mb-1 left-0 w-44 p-1.5 bg-white dark:bg-zinc-800 rounded-md shadow-md border border-zinc-200 dark:border-zinc-700 z-20 space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 px-2 block">
                    Gắn nhãn
                  </span>
                  {labels.length === 0 ? (
                    <p className="text-xs text-zinc-400 px-2 py-1">Chưa có nhãn</p>
                  ) : (
                    labels.map((lbl) => {
                      const isChecked = noteLabels.includes(lbl.name);
                      return (
                        <button
                          key={lbl.id}
                          onClick={() => handleToggleLabel(lbl.name)}
                          className="w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
                        >
                          <span className="truncate text-zinc-700 dark:text-zinc-300">
                            #{lbl.name}
                          </span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Nút chèn nhanh Checklist Todo (Tiêu chí 11, 12 UX) */}
            <button
              onClick={handleInsertChecklist}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"
              title="Chèn việc cần làm (Checklist)"
            >
              <ListTodo className="w-4 h-4" />
            </button>

            {/* Đính kèm tệp */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"
              title="Đính kèm tệp/ảnh"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Khóa mật khẩu */}
            <button
              onClick={() => setShowPasswordSetup(true)}
              className={`p-1.5 rounded transition-colors ${
                editingNote.isLocked ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title={editingNote.isLocked ? 'Quản lý mật khẩu note' : 'Đặt mật khẩu note'}
            >
              {editingNote.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>

            {/* Nút xóa */}
            {!editingNote.isNew && (
              <button
                onClick={() => setNoteToDelete(editingNote)}
                className="p-1.5 text-zinc-400 hover:text-red-600 rounded"
                title="Xóa note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          )}

          <button
            onClick={handleClose}
            className="px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* POPUP THIẾT LẬP MẬT KHẨU GHI CHÚ */}
      {showPasswordSetup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowPasswordSetup(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-md shadow-md p-4 border border-zinc-200 dark:border-zinc-800 z-10">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              {editingNote.isLocked ? 'Gỡ bỏ mật khẩu bảo vệ' : 'Đặt mật khẩu cho ghi chú'}
            </h4>
            <p className="text-xs text-zinc-500 mb-3">
              {editingNote.isLocked
                ? 'Nhập đúng mật khẩu hiện tại để hủy bảo vệ.'
                : 'Mỗi ghi chú có thể đặt mật khẩu riêng. Nhập 2 lần để tránh gõ nhầm.'}
            </p>

            {editingNote.isLocked ? (
              <form onSubmit={handleDisablePassword} className="space-y-2.5">
                <input
                  type="password"
                  value={currentPassForDisable}
                  onChange={(e) => setCurrentPassForDisable(e.target.value)}
                  placeholder="Mật khẩu hiện tại..."
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 text-xs border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSetup(false)}
                    className="px-3 py-1 text-xs text-zinc-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded font-medium"
                  >
                    Xác nhận hủy
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEnablePassword} className="space-y-2.5">
                <input
                  type="password"
                  value={pass1}
                  onChange={(e) => setPass1(e.target.value)}
                  placeholder="Mật khẩu mới..."
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 text-xs border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none"
                  autoFocus
                />
                <input
                  type="password"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 text-xs border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSetup(false)}
                    className="px-3 py-1 text-xs text-zinc-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded font-medium"
                  >
                    Lưu mật khẩu
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
