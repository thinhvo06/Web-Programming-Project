const jwt = require('jsonwebtoken');
const { User, Note, NoteShare } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'tdtu_web_programming_final_project_jwt_secret_key_2026';

// Map of active users per note room: noteId -> Map(socketId -> { user, color })
const activeRoomUsers = new Map();

// Debounce map for DB persistence: noteId -> timer
const autoSaveTimers = new Map();

const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

function getRandomColor(seed) {
  const index = Math.abs(seed) % USER_COLORS.length;
  return USER_COLORS[index];
}

/**
 * Socket.IO Collaboration Handler (Tiêu chí 26)
 */
function initCollaborationSocket(io) {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Yêu cầu token xác thực để kết nối WebSocket.'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'display_name', 'avatar_url']
      });

      if (!user) {
        return next(new Error('Người dùng không tồn tại.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Xác thực WebSocket thất bại: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] User connected: ${user.display_name} (${user.email}) - SocketID: ${socket.id}`);

    /**
     * Join Note Room (Only if Owner OR Shared with 'edit' permission)
     */
    socket.on('join-note', async ({ noteId }) => {
      try {
        if (!noteId) return;

        const note = await Note.findByPk(noteId, {
          include: [{ model: NoteShare, as: 'shares' }]
        });

        if (!note) {
          socket.emit('error', { message: 'Không tìm thấy ghi chú.' });
          return;
        }

        const isOwner = note.user_id === user.id;
        const canEdit = isOwner || (note.shares && note.shares.some(s => s.shared_with_user_id === user.id && s.permission === 'edit'));

        if (!canEdit) {
          socket.emit('error', { message: 'Bạn không có quyền chỉnh sửa ghi chú này để cộng tác thời gian thực.' });
          return;
        }

        const roomName = `note:${noteId}`;
        socket.join(roomName);
        socket.currentNoteId = noteId;

        // Manage active room users
        if (!activeRoomUsers.has(noteId)) {
          activeRoomUsers.set(noteId, new Map());
        }

        const roomUsers = activeRoomUsers.get(noteId);
        roomUsers.set(socket.id, {
          id: user.id,
          display_name: user.display_name,
          email: user.email,
          avatar_url: user.avatar_url || '/public/default-avatar.svg',
          color: getRandomColor(user.id)
        });

        // Broadcast current users in this note
        const currentUsersList = Array.from(roomUsers.values());
        io.to(roomName).emit('room-users', {
          noteId,
          users: currentUsersList
        });

        console.log(`[Socket] User ${user.display_name} joined room ${roomName}. Total users: ${currentUsersList.length}`);
      } catch (err) {
        console.error('[Socket] join-note error:', err);
      }
    });

    /**
     * Realtime note modification broadcast
     */
    socket.on('note-change', async ({ noteId, title, content }) => {
      try {
        const roomName = `note:${noteId}`;

        // Broadcast changes to all other users in the room immediately
        socket.to(roomName).emit('note-updated', {
          noteId,
          title,
          content,
          updated_by: {
            id: user.id,
            display_name: user.display_name
          },
          updated_at: new Date()
        });

        // Debounced persistence to Database (auto-save in background)
        if (autoSaveTimers.has(noteId)) {
          clearTimeout(autoSaveTimers.get(noteId));
        }

        const timer = setTimeout(async () => {
          try {
            const note = await Note.findByPk(noteId);
            if (note) {
              if (title !== undefined) note.title = title;
              if (content !== undefined) note.content = content;
              await note.save();
              console.log(`[Socket Auto-Save] Note ${noteId} synced to DB successfully.`);
            }
          } catch (dbErr) {
            console.error('[Socket Auto-Save] DB sync error:', dbErr.message);
          } finally {
            autoSaveTimers.delete(noteId);
          }
        }, 600); // 600ms debounce

        autoSaveTimers.set(noteId, timer);
      } catch (err) {
        console.error('[Socket] note-change error:', err);
      }
    });

    /**
     * Broadcast user typing indicator / cursor
     */
    socket.on('user-typing', ({ noteId, isTyping, cursorPosition }) => {
      const roomName = `note:${noteId}`;
      socket.to(roomName).emit('user-typing', {
        noteId,
        user: {
          id: user.id,
          display_name: user.display_name,
          color: getRandomColor(user.id)
        },
        isTyping,
        cursorPosition
      });
    });

    /**
     * Leave Note Room
     */
    socket.on('leave-note', ({ noteId }) => {
      leaveRoom(socket, noteId);
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      if (socket.currentNoteId) {
        leaveRoom(socket, socket.currentNoteId);
      }
      console.log(`[Socket] User disconnected: ${user.display_name} - SocketID: ${socket.id}`);
    });
  });

  function leaveRoom(socket, noteId) {
    if (!noteId) return;
    const roomName = `note:${noteId}`;
    socket.leave(roomName);

    if (activeRoomUsers.has(noteId)) {
      const roomUsers = activeRoomUsers.get(noteId);
      roomUsers.delete(socket.id);

      const remainingUsers = Array.from(roomUsers.values());
      io.to(roomName).emit('room-users', {
        noteId,
        users: remainingUsers
      });

      if (remainingUsers.length === 0) {
        activeRoomUsers.delete(noteId);
      }
    }
  }
}

module.exports = {
  initCollaborationSocket
};
