import http from 'http';
import { createApp } from './app';
import { initializeSocket } from './lib/socket';
import { prisma } from './lib/db';
import { redis } from './lib/redis';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO
  initializeSocket(server);

  // Verify database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Start server
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🚀 VendorBridge API Server                     ║
║                                                  ║
║   Local:    http://localhost:${PORT}               ║
║   Health:   http://localhost:${PORT}/api/health    ║
║   Env:      ${process.env.NODE_ENV || 'development'}                     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      console.log('👋 Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
