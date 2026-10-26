const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function init() {
  try {
    const userCount = await prisma.user.count();
    console.log(`[Database Init] Current user count: ${userCount}`);
    if (userCount === 0) {
      console.log('[Database Init] Database empty. Running seed...');
      execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
      console.log('[Database Init] Seed completed successfully.');
    } else {
      console.log('[Database Init] Database already initialized with demo records.');
    }
  } catch (err) {
    console.error('[Database Init Error]:', err);
    // If table doesn't exist yet, run seed
    try {
      console.log('[Database Init] Attempting initial seed...');
      execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
    } catch (seedErr) {
      console.error('[Database Seed Error]:', seedErr);
    }
  } finally {
    await prisma.$disconnect();
  }
}

init();
