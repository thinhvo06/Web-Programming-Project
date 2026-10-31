const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');
const { initCollaborationSocket } = require('./sockets/collaboration.socket');

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach collaboration sockets
initCollaborationSocket(io);

async function startServer() {
  try {
    // Authenticate and sync Database
    await sequelize.authenticate();
    console.log(`[Database] Kết nối cơ sở dữ liệu (${sequelize.getDialect()}) thành công!`);

    // Sync schema
    await sequelize.sync({ alter: true });
    console.log('[Database] Đã đồng bộ Schema bảng dữ liệu thành công!');

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 TDTU Note App Backend is running on port ${PORT}`);
      console.log(`📡 REST API Base URL: http://localhost:${PORT}/api`);
      console.log(`⚡ WebSocket Server: Ready for realtime collaboration`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('❌ Không thể khởi động máy chủ:', error);
    process.exit(1);
  }
}

startServer();
