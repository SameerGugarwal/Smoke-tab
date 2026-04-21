const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join tab room (both vendor and buyer)
    socket.on('join:tab', ({ tabId }) => {
      socket.join(`tab:${tabId}`);
    });

    // Join user room (for notifications)
    socket.on('join:user', ({ userId }) => {
      socket.join(`user:${userId}`);
    });

    socket.on('leave:tab', ({ tabId }) => {
      socket.leave(`tab:${tabId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
