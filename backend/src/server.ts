import app from './app';
import { prisma } from './prisma/client';

const PORT = process.env.PORT || 5000;

async function main() {
  const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
  for (const variable of REQUIRED_ENV) {
    if (!process.env[variable]) {
      console.error(`❌ Critical Error: Missing required environment variable ${variable}`);
      process.exit(1);
    }
  }

  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

main();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
