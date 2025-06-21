import app from './app';
import config from './config';
import prisma from './lib/prisma';
import { validateEnvironmentVariables, checkEnvFileSecurity } from './utils/envValidator';

// 启动前验证环境变量
validateEnvironmentVariables();
checkEnvFileSecurity();

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    const PORT = config.port || 3000;
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();