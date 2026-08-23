const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
      }
    });

    // Join workspace room
    socket.on('join_workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace_${workspaceId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined workspace_${workspaceId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Emit an event to an entire workspace
const emitWorkspaceEvent = (workspaceId, eventType, data) => {
  if (io && workspaceId) {
    io.to(`workspace_${workspaceId}`).emit(eventType, data);
    console.log(`[Socket.IO] Emitted ${eventType} to workspace_${workspaceId}`);
  }
};

// Emit an event to a specific user
const emitUserEvent = (userId, eventType, data) => {
  if (io && userId) {
    io.to(`user_${userId}`).emit(eventType, data);
    console.log(`[Socket.IO] Emitted ${eventType} to user_${userId}`);
  }
};

// Broadcast activity to workspace
const broadcastActivity = (workspaceId, activity) => {
  if (io && workspaceId) {
    io.to(`workspace_${workspaceId}`).emit('activity_new', activity);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitWorkspaceEvent,
  emitUserEvent,
  broadcastActivity
};
