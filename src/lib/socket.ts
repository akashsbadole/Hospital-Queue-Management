import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle support ticket notifications
    socket.on('join-support-room', (userRole: string) => {
      if (['STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        socket.join('support-staff');
        console.log(`User ${socket.id} joined support staff room`);
      }
    });

    // Handle department-specific notifications
    socket.on('join-department-room', (departmentId: string) => {
      socket.join(`department-${departmentId}`);
      console.log(`User ${socket.id} joined department ${departmentId} room`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};