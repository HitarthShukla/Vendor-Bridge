import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../middleware/authenticate';

let io: Server;

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ─── Authentication Middleware ──────────────────────────────────────────────

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      (socket as Socket & { user: JwtPayload }).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────

  io.on('connection', (socket) => {
    const user = (socket as Socket & { user: JwtPayload }).user;
    console.log(`🔌 Socket connected: ${user.email} (${user.role})`);

    // Join personal room
    socket.join(`user:${user.userId}`);

    // Join role-based rooms
    switch (user.role) {
      case 'ADMIN':
        socket.join('org:admin');
        socket.join('org:procurement');
        break;
      case 'PROCUREMENT_OFFICER':
        socket.join('org:procurement');
        break;
      case 'MANAGER':
        socket.join('org:procurement');
        socket.join(`approver:${user.userId}`);
        break;
      case 'VENDOR':
        socket.join('org:vendor');
        break;
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${user.email}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// ─── Emit Helpers ──────────────────────────────────────────────────────────────

export function emitToUser(userId: string, event: string, data: unknown) {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToProcurement(event: string, data: unknown) {
  getIO().to('org:procurement').emit(event, data);
}

export function emitToRfqRoom(rfqId: string, event: string, data: unknown) {
  getIO().to(`rfq:${rfqId}`).emit(event, data);
}

export function emitToApprover(approverId: string, event: string, data: unknown) {
  getIO().to(`approver:${approverId}`).emit(event, data);
}
