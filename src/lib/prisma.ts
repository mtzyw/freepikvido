import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // 生产环境：创建新实例
  prisma = new PrismaClient({
    log: ['error'], // 生产环境只记录错误日志
  });
} else {
  // 开发环境：复用全局实例，避免热重载时创建多个连接
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], // 开发环境详细日志
    });
  }
  prisma = global.__prisma;
}

// 优雅关闭数据库连接
process.on('SIGINT', async () => {
  console.log('正在关闭数据库连接...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('正在关闭数据库连接...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;