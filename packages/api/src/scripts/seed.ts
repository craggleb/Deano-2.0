import { prisma } from '@/lib/database';
import { connectDatabase, disconnectDatabase } from '@/lib/database';
import { addDays } from 'date-fns';

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    await connectDatabase();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.dependency.deleteMany();
    await prisma.task.deleteMany();

    // Create sample tasks
    console.log('📝 Creating sample tasks...');

    // Simple tasks without complex dependencies
    const task1 = await prisma.task.create({
      data: {
        title: 'Plan Project Architecture',
        description: 'Design the overall system architecture and technology stack',
        priority: 'High',
        dueAt: addDays(new Date(), 2),
        estimatedDurationMinutes: 120,
        allowParentAutoComplete: false,
      },
    });

    const task2 = await prisma.task.create({
      data: {
        title: 'Set Up Development Environment',
        description: 'Install and configure all development tools and dependencies',
        priority: 'Medium',
        dueAt: addDays(new Date(), 1),
        estimatedDurationMinutes: 60,
        allowParentAutoComplete: false,
      },
    });

    const task3 = await prisma.task.create({
      data: {
        title: 'Implement Core API Endpoints',
        description: 'Create REST API endpoints for task management',
        priority: 'High',
        dueAt: addDays(new Date(), 4),
        estimatedDurationMinutes: 240,
        allowParentAutoComplete: false,
      },
    });

    await prisma.task.create({
      data: {
        title: 'Create Frontend Components',
        description: 'Build React components for task management',
        priority: 'Medium',
        dueAt: addDays(new Date(), 5),
        estimatedDurationMinutes: 180,
        allowParentAutoComplete: false,
      },
    });

    await prisma.task.create({
      data: {
        title: 'Write Documentation',
        description: 'Create comprehensive documentation',
        priority: 'Low',
        dueAt: addDays(new Date(), 7),
        estimatedDurationMinutes: 90,
        allowParentAutoComplete: false,
      },
    });

    // Create one simple dependency
    console.log('🔗 Creating simple dependency...');
    await prisma.dependency.create({
      data: {
        taskId: task3.id,
        dependsOnTaskId: task2.id,
      },
    });

    // Complete one task
    console.log('✅ Completing one task...');
    await prisma.task.update({
      where: { id: task1.id },
      data: { status: 'Completed' },
    });

    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Sample data created:');
    console.log(`- 5 tasks in various states`);
    console.log(`- 1 dependency relationship`);
    console.log(`- 1 completed task`);
    console.log('\n🚀 You can now test the application!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  seed();
}
