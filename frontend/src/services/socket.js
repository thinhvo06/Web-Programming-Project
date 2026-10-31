import { io } from 'socket.io-client';

let socket = null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function getSocket() {
  const token = localStorage.getItem('noteapp_token');

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 3,
      timeout: 5000,
      auth: {
        token: token || ''
      }
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Đã kết nối thành công tới máy chủ:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Chưa kết nối được (BE chưa chạy hoặc offline):', err.message);
    });
  }
  return socket;
}

// 1. Khi mở màn hình Edit của noteId -> Tham gia room (Tiêu chí 26)
export function joinNoteRoom(noteId) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  s.emit('join-note', { noteId });
}

// 2. Khi đóng modal / rời khỏi ghi chú
export function leaveNoteRoom(noteId) {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave-note', { noteId });
  }
}

// 3. Khi người dùng gõ thay đổi title hoặc content -> phát lên server
export function emitNoteChange(noteId, title, content) {
  const s = getSocket();
  if (s.connected) {
    s.emit('note-change', { noteId, title, content });
  }
}

// 4. Phát trạng thái đang soạn thảo (typing indicator)
export function emitUserTyping(noteId, isTyping) {
  const s = getSocket();
  if (s.connected) {
    s.emit('user-typing', { noteId, isTyping });
  }
}

// 5. Lắng nghe danh sách những người đang cùng mở note này
export function onRoomUsers(callback) {
  const s = getSocket();
  s.on('room-users', callback);
  return () => s.off('room-users', callback);
}

// 6. Lắng nghe khi người khác gõ để cập nhật nội dung tức thì
export function onNoteUpdated(callback) {
  const s = getSocket();
  s.on('note-updated', callback);
  return () => s.off('note-updated', callback);
}

// 7. Lắng nghe thông báo đang soạn thảo từ người khác
export function onUserTyping(callback) {
  const s = getSocket();
  s.on('user-typing', callback);
  return () => s.off('user-typing', callback);
}
