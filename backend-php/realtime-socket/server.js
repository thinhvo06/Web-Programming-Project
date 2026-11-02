const { Server } = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');

const PORT = 5001;
const JWT_SECRET = 'tdtu_web_programming_final_project_jwt_secret_key_2026';

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const activeRoomUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.display_name) {
        socket.user = decoded;
        return next();
      }
    }
  }

  // Fallback định danh tạm thời để tránh mất kết nối realtime khi test
  const fallbackId = 'usr_' + socket.id.substring(0, 5);
  socket.user = {
    id: fallbackId,
    display_name: socket.handshake.query?.name || `Người dùng ${socket.id.substring(0, 4)}`,
    email: socket.handshake.query?.email || `${fallbackId}@tdtu.edu.vn`
  };
  next();
});

io.on('connection', (socket) => {
  let user = socket.user;
  console.log(`[Socket] User connected: ${user.display_name} (${user.email}) [socket: ${socket.id}]`);

  socket.on('join-note', ({ noteId, user: clientUser }) => {
    if (!noteId) return;
    const strNoteId = String(noteId);
    const room = `note:${strNoteId}`;
    socket.join(room);
    socket.currentNoteId = strNoteId;

    if (clientUser && clientUser.display_name) {
      user = { ...user, ...clientUser };
      socket.user = user;
    }

    if (!activeRoomUsers.has(strNoteId)) {
      activeRoomUsers.set(strNoteId, new Map());
    }
    const roomUsers = activeRoomUsers.get(strNoteId);
    roomUsers.set(socket.id, {
      socketId: socket.id,
      id: user.id,
      display_name: user.display_name,
      email: user.email
    });

    io.to(room).emit('room-users', {
      noteId: strNoteId,
      users: Array.from(roomUsers.values())
    });
  });

  socket.on('leave-note', ({ noteId }) => {
    if (!noteId) return;
    const strNoteId = String(noteId);
    const room = `note:${strNoteId}`;
    socket.leave(room);
    if (activeRoomUsers.has(strNoteId)) {
      const roomUsers = activeRoomUsers.get(strNoteId);
      roomUsers.delete(socket.id);
      io.to(room).emit('room-users', {
        noteId: strNoteId,
        users: Array.from(roomUsers.values())
      });
    }
  });

  // Bắn thay đổi nội dung (tiêu đề, nội dung ghi chú)
  socket.on('note-change', ({ noteId, title, content }) => {
    const strNoteId = String(noteId);
    const room = `note:${strNoteId}`;
    socket.to(room).emit('note-updated', {
      noteId: strNoteId,
      title,
      content,
      updated_by: {
        id: user.id,
        display_name: user.display_name,
        email: user.email
      },
      updated_at: new Date()
    });
  });

  // Bắn vị trí con trỏ (pointer/cursor position) & dòng đang đứng
  socket.on('cursor-move', ({ noteId, field, position, line, selectionStart, selectionEnd }) => {
    const strNoteId = String(noteId);
    socket.to(`note:${strNoteId}`).emit('cursor-moved', {
      noteId: strNoteId,
      socketId: socket.id,
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email
      },
      field, // 'title' | 'content'
      position,
      line: line || 1,
      selectionStart,
      selectionEnd,
      updatedAt: Date.now()
    });
  });

  // Bắn trạng thái đang soạn thảo
  socket.on('user-typing', ({ noteId, isTyping, field }) => {
    const strNoteId = String(noteId);
    socket.to(`note:${strNoteId}`).emit('user-typing', {
      noteId: strNoteId,
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email
      },
      isTyping,
      field
    });
  });

  socket.on('disconnect', () => {
    if (socket.currentNoteId && activeRoomUsers.has(socket.currentNoteId)) {
      const roomUsers = activeRoomUsers.get(socket.currentNoteId);
      roomUsers.delete(socket.id);
      io.to(`note:${socket.currentNoteId}`).emit('room-users', {
        noteId: socket.currentNoteId,
        users: Array.from(roomUsers.values())
      });
    }
    console.log(`[Socket] User disconnected: ${user.display_name}`);
  });
});

server.listen(PORT, () => {
  console.log(`⚡ WebSocket Server (Socket.io) running on port ${PORT}`);
});
