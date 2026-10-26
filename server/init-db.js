const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function init() {
  console.log('====================================================');
  console.log('🚀 [BrandGuard AI Startup] Initializing Database...');
  console.log('====================================================');

  try {
    // 1. Ensure SQLite database directory exists if using file path
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    console.log(`📡 [Database Config] URL: ${dbUrl}`);

    if (dbUrl.startsWith('file:')) {
      const filePath = dbUrl.replace('file:', '');
      const absPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      const dir = path.dirname(absPath);
      if (!fs.existsSync(dir)) {
        console.log(`📁 [Database Setup] Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // 2. Safely synchronize schema without deleting data
    console.log('🔄 [Database Setup] Synchronizing schema with Prisma db push...');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });

    // 3. Check if demo data already exists
    const userCount = await prisma.user.count();
    console.log(`📊 [Database State] Existing user count: ${userCount}`);

    if (userCount === 0) {
      console.log('🌱 [Database Seed] No existing records found. Seeding NovaTech demo workspace...');
      execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
      console.log('✅ [Database Seed] Seeding completed successfully.');
    } else {
      console.log('ℹ️ [Database State] Existing records found. Skipping seed to preserve persistent data.');
    }

    console.log('====================================================');
    console.log('✅ [BrandGuard AI Startup] Database is ready.');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ [Database Init Fatal Error]:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

init();
