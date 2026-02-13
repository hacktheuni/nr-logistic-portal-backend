import { app } from '@/app';
import { config } from '@/config/env';
import { prisma } from '@/db/prisma';
import { logger } from '@/config/logger';

const port = config.port || 8000;

const startServer = async () => {
  try {
    await prisma.$connect();

    app.listen(port, () => {
      logger.info(`Server running on port:  http://localhost:${port}`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
