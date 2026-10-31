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
  if (!token) {
    return next(new Error('Yêu cầu token xác thực.'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Token không hợp lệ hoặc đã hết hạn.'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  console.log(`[Socket] User connected: ${user.display_name} (${user.email})`);

  socket.on('join-note', ({ noteId }) => {
    if (!noteId) return;
    const room = `note:${noteId}`;
    socket.join(room);
    socket.currentNoteId = noteId;

    if (!activeRoomUsers.has(noteId)) {
      activeRoomUsers.set(noteId, new Map());
    }
    const roomUsers = activeRoomUsers.get(noteId);
    roomUsers.set(socket.id, {
      id: user.id,
      display_name: user.display_name,
      email: user.email
    });

    io.to(room).emit('room-users', {
      noteId,
      users: Array.from(roomUsers.values())
    });
  });

  socket.on('note-change', ({ noteId, title, content }) => {
    const room = `note:${noteId}`;
    socket.to(room).emit('note-updated', {
      noteId,
      title,
      content,
      updated_by: {
        id: user.id,
        display_name: user.display_name
      },
      updated_at: new Date()
    });
  });

  socket.on('user-typing', ({ noteId, isTyping, cursorPosition }) => {
    socket.to(`note:${noteId}`).emit('user-typing', {
      noteId,
      user: {
        id: user.id,
        display_name: user.display_name
      },
      isTyping,
      cursorPosition
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
