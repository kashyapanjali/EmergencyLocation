let io;

exports.initialize = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Handle location updates
    socket.on('updateLocation', (data) => {
      // Broadcast the location to all connected clients
      io.emit('locationUpdate', data);
    });
  });
};

exports.getLocationIo = () => io;
