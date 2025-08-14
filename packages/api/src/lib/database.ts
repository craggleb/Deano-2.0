import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run migrations if needed
    try {
      const { execSync } = require('child_process');
      console.log('🔄 Running database migrations...');
      
      // First, try to resolve any failed migrations
      try {
        console.log('🔧 Attempting to resolve failed migrations...');
        execSync('npx prisma migrate resolve --applied 20250101000000_add_task_audit_trail', { 
          stdio: 'pipe',
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
        });
        console.log('✅ Failed migration resolved');
      } catch (resolveError) {
        // Ignore resolve errors, continue with deploy
        console.log('ℹ️ No failed migrations to resolve or already resolved');
      }
      
      // Then run migrations
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
      });
      console.log('✅ Database migrations completed successfully');
      
      // Verify critical tables exist
      await verifyCriticalTables();
      
    } catch (migrationError) {
      console.error('❌ Failed to run migrations:', migrationError);
      // Try to ensure critical tables exist even if migrations fail
      await ensureCriticalTables();
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

async function verifyCriticalTables(): Promise<void> {
  try {
    // Check if task_audits table exists
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'task_audits'
      ) as exists
    `;
    
    if (!tableExists[0]?.exists) {
      console.log('⚠️ task_audits table missing, creating it...');
      await createTaskAuditsTable();
    }
  } catch (error) {
    console.error('❌ Error verifying critical tables:', error);
  }
}

async function ensureCriticalTables(): Promise<void> {
  try {
    console.log('🔧 Ensuring critical tables exist...');
    await createTaskAuditsTable();
  } catch (error) {
    console.error('❌ Error ensuring critical tables:', error);
  }
}

async function createTaskAuditsTable(): Promise<void> {
  try {
    // Check if table already exists
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'task_audits'
      ) as exists
    `;
    
    if (tableExists[0]?.exists) {
      console.log('✅ task_audits table already exists');
      return;
    }
    
    // Create the table with proper case-sensitive column names
    await prisma.$executeRaw`
      CREATE TABLE "task_audits" (
        "id" TEXT NOT NULL,
        "taskId" TEXT NOT NULL,
        "fieldName" VARCHAR(50) NOT NULL,
        "oldValue" TEXT,
        "newValue" TEXT,
        "changedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "task_audits_pkey" PRIMARY KEY ("id")
      )
    `;
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX "task_audits_taskId_idx" ON "task_audits"("taskId")`;
    await prisma.$executeRaw`CREATE INDEX "task_audits_fieldName_idx" ON "task_audits"("fieldName")`;
    await prisma.$executeRaw`CREATE INDEX "task_audits_changedAt_idx" ON "task_audits"("changedAt")`;
    
    // Add foreign key constraint (only if tasks table exists)
    const tasksTableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tasks'
      ) as exists
    `;
    
    if (tasksTableExists[0]?.exists) {
      await prisma.$executeRaw`
        ALTER TABLE "task_audits" 
        ADD CONSTRAINT "task_audits_taskId_fkey" 
        FOREIGN KEY ("taskId") REFERENCES "tasks"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `;
    }
    
    console.log('✅ task_audits table created successfully');
  } catch (error) {
    console.error('❌ Error creating task_audits table:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});
