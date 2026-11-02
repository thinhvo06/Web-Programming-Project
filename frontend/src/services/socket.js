import { io } from 'socket.io-client';

let socket = null;
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5001';
const SOCKET_URL = rawSocketUrl.replace('//localhost:', '//127.0.0.1:');

export function getSocket() {
  const token = localStorage.getItem('noteapp_token');

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
      transports: ['websocket', 'polling'],
      auth: {
        token: token || ''
      }
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.io] Đã kết nối thành công tới máy chủ:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Kết nối Socket gặp sự cố:', err.message);
    });
  }

  // Luôn cập nhật token mới nhất trước mỗi phiên
  if (token) {
    socket.auth = { token };
  }

  return socket;
}

// 1. Khi mở màn hình Edit của noteId -> Tham gia room
export function joinNoteRoom(noteId, currentUser) {
  if (!noteId) return;
  const s = getSocket();
  const token = localStorage.getItem('noteapp_token');
  if (token) s.auth = { token };

  const strId = String(noteId);
  const payload = {
    noteId: strId,
    user: currentUser
      ? {
          id: currentUser.id,
          display_name: currentUser.displayName || currentUser.display_name,
          email: currentUser.email
        }
      : null
  };

  if (!s.connected) {
    s.connect();
    s.once('connect', () => {
      s.emit('join-note', payload);
    });
  } else {
    s.emit('join-note', payload);
  }
}

// 2. Khi đóng modal / rời khỏi ghi chú
export function leaveNoteRoom(noteId) {
  if (!noteId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('leave-note', { noteId: String(noteId) });
  }
}

// 3. Khi người dùng gõ thay đổi title hoặc content -> phát lên server ngay lập tức
export function emitNoteChange(noteId, title, content) {
  if (!noteId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('note-change', { noteId: String(noteId), title, content });
  }
}

// 4. Phát vị trí con trỏ (pointer/cursor) và dòng đang chỉnh sửa
export function emitCursorMove(noteId, cursorData) {
  if (!noteId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('cursor-move', { noteId: String(noteId), ...cursorData });
  }
}

// 5. Phát trạng thái đang soạn thảo (typing indicator)
export function emitUserTyping(noteId, isTyping, field = 'content') {
  if (!noteId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('user-typing', { noteId: String(noteId), isTyping, field });
  }
}

// 6. Lắng nghe danh sách những người đang cùng mở note này
export function onRoomUsers(callback) {
  const s = getSocket();
  s.on('room-users', callback);
  return () => s.off('room-users', callback);
}

// 7. Lắng nghe khi người khác gõ để cập nhật nội dung tức thì
export function onNoteUpdated(callback) {
  const s = getSocket();
  s.on('note-updated', callback);
  return () => s.off('note-updated', callback);
}

// 8. Lắng nghe vị trí con trỏ của người khác
export function onCursorMoved(callback) {
  const s = getSocket();
  s.on('cursor-moved', callback);
  return () => s.off('cursor-moved', callback);
}

// 9. Lắng nghe thông báo đang soạn thảo từ người khác
export function onUserTyping(callback) {
  const s = getSocket();
  s.on('user-typing', callback);
  return () => s.off('user-typing', callback);
}
